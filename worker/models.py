from datetime import date
from collections import defaultdict

from dateutil.parser import parse as parse_date

from config import (
    APP_SEASON,
    ROUND_DATE_RANGES,
    SCORING,
    STATUS_UPCOMING,
    STATUS_IN_PROGRESS,
    STATUS_RESOLVED,
)


# ---------------------------------------------------------------------------
# Round detection
# ---------------------------------------------------------------------------

def detect_round(game_date_str: str) -> str:
    """
    Determine the playoff round based on the game date.
    Falls back to 'firstRound' if the date doesn't match any configured range.
    """
    try:
        game_date = parse_date(game_date_str).date()
    except (ValueError, TypeError):
        return "firstRound"

    for round_name, start_str, end_str in ROUND_DATE_RANGES:
        start = date.fromisoformat(start_str)
        end = date.fromisoformat(end_str)
        if start <= game_date <= end:
            return round_name

    # If the date is before the play-in, default to playin;
    # if after finals, default to finals; otherwise firstRound.
    playin_start = date.fromisoformat(ROUND_DATE_RANGES[0][1])
    finals_end = date.fromisoformat(ROUND_DATE_RANGES[-1][2])
    if game_date < playin_start:
        return "playin"
    if game_date > finals_end:
        return "finals"
    return "firstRound"


def detect_event_type(round_name: str) -> str:
    """Return the eventType based on the round."""
    if round_name == "playin":
        return "playin"
    return "game"


# ---------------------------------------------------------------------------
# Game-number derivation
# ---------------------------------------------------------------------------

def compute_game_numbers(games: list[dict]) -> dict[int, int]:
    """
    For each game, compute its game number within the series (matchup).
    Returns a mapping of BDL game_id -> game_number.

    Games between the same two teams in the postseason are grouped together,
    sorted by date, and numbered sequentially.
    """
    # Group games by matchup (sorted team names to normalise home/away)
    matchups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for game in games:
        team_a = game["home_team"]["name"]
        team_b = game["visitor_team"]["name"]
        key = tuple(sorted([team_a, team_b]))
        matchups[key].append(game)

    game_number_map: dict[int, int] = {}
    for _key, matchup_games in matchups.items():
        # Sort by datetime so game 1 is earliest
        matchup_games.sort(key=lambda g: g.get("datetime") or g.get("date", ""))
        for idx, game in enumerate(matchup_games, start=1):
            game_number_map[game["id"]] = idx

    return game_number_map


# ---------------------------------------------------------------------------
# Map BDL game -> Supabase event row
# ---------------------------------------------------------------------------

def map_game_to_event(game: dict, game_number: int) -> dict:
    """Convert a BallDontLie game object to a Supabase event row."""
    bdl_status = game.get("status", "")
    period = game.get("period", 0)

    if bdl_status == "Final":
        status = STATUS_RESOLVED
    elif period > 0:
        status = STATUS_IN_PROGRESS
    else:
        status = STATUS_UPCOMING

    round_name = detect_round(game.get("datetime") or game.get("date", ""))
    event_type = detect_event_type(round_name)

    return {
        "id": str(game["id"]),
        "team1": game["home_team"]["name"],
        "team2": game["visitor_team"]["name"],
        "team1Score": game.get("home_team_score", 0) or 0,
        "team2Score": game.get("visitor_team_score", 0) or 0,
        "startTime": game.get("datetime") or game.get("date", ""),
        "parentEvent": str(game["id"]),
        "status": status,
        "eventType": event_type,
        "round": round_name,
        "gameNumber": game_number,
        "season": APP_SEASON,
    }


# ---------------------------------------------------------------------------
# Series-level event logic
# ---------------------------------------------------------------------------

def build_series_events(
    games: list[dict],
    existing_events_by_parse: dict[str, dict],
) -> tuple[list[dict], list[tuple[str, dict]]]:
    """
    Build series-level events from the individual games.

    Returns:
        new_series  -- list of new series event dicts to insert
        updates     -- list of (event_id, update_dict) for existing series to update
    """
    # Group games by matchup
    matchups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for game in games:
        team_a = game["home_team"]["name"]
        team_b = game["visitor_team"]["name"]
        key = tuple(sorted([team_a, team_b]))
        matchups[key].append(game)

    new_series: list[dict] = []
    updates: list[tuple[str, dict]] = []

    for (team_a_sorted, team_b_sorted), matchup_games in matchups.items():
        matchup_games.sort(key=lambda g: g.get("datetime") or g.get("date", ""))

        # Use the first game to determine consistent team1/team2 ordering
        first_game = matchup_games[0]
        team1 = first_game["home_team"]["name"]
        team2 = first_game["visitor_team"]["name"]

        # Count wins
        team1_wins = 0
        team2_wins = 0
        for g in matchup_games:
            if g.get("status") == "Final":
                home_score = g.get("home_team_score", 0) or 0
                visitor_score = g.get("visitor_team_score", 0) or 0
                home_name = g["home_team"]["name"]
                if home_score > visitor_score:
                    winner = home_name
                else:
                    winner = g["visitor_team"]["name"]
                if winner == team1:
                    team1_wins += 1
                else:
                    team2_wins += 1

        total_games = team1_wins + team2_wins
        earliest_datetime = matchup_games[0].get("datetime") or matchup_games[0].get("date", "")
        round_name = detect_round(earliest_datetime)

        # Determine series status
        wins_to_clinch = 1 if round_name == "playin" else 4
        if team1_wins >= wins_to_clinch or team2_wins >= wins_to_clinch:
            series_status = STATUS_RESOLVED
        elif team1_wins + team2_wins > 0:
            series_status = STATUS_IN_PROGRESS
        else:
            series_status = STATUS_UPCOMING

        # Series parentEvent key: "series_{teamA}_{teamB}" (sorted for consistency)
        series_parse_key = f"series_{team_a_sorted}_{team_b_sorted}"

        existing = existing_events_by_parse.get(series_parse_key)
        if existing:
            # Update existing series event
            update_data = {
                "team1Score": team1_wins,
                "team2Score": team2_wins,
                "status": series_status,
                "gameNumber": total_games,
            }
            updates.append((existing["id"], update_data))
        else:
            # Create new series event
            new_series.append({
                "id": series_parse_key,
                "team1": team1,
                "team2": team2,
                "team1Score": team1_wins,
                "team2Score": team2_wins,
                "startTime": earliest_datetime,
                "parentEvent": series_parse_key,
                "status": series_status,
                "eventType": "series",
                "round": round_name,
                "gameNumber": total_games,
                "season": APP_SEASON,
            })

    return new_series, updates


# ---------------------------------------------------------------------------
# Bet point calculation
# ---------------------------------------------------------------------------

def calculate_points(
    bet: dict,
    event: dict,
    all_event_bets: list[dict],
) -> tuple[int, int]:
    """
    Calculate (pointsGained, pointsGainedWinMargin) for a single bet.

    event must be fully resolved (status == STATUS_RESOLVED) with final scores.
    all_event_bets is the full list of every user's bet on this event — needed
    to determine who was 'closest' on the margin guess.
    """
    event_type = event.get("eventType", "")
    round_name = event.get("round", "")
    rules = SCORING.get(round_name, {})

    if event_type in ("game", "playin"):
        return _calc_game_points(bet, event, all_event_bets, rules)
    if event_type == "series":
        return _calc_series_points(bet, event, rules)
    return 0, 0


def _calc_game_points(
    bet: dict,
    event: dict,
    all_event_bets: list[dict],
    rules: dict[str, int],
) -> tuple[int, int]:
    actual_winner = (
        event["team1"] if event["team1Score"] > event["team2Score"] else event["team2"]
    )
    actual_diff = abs(event["team1Score"] - event["team2Score"])
    correct_winner = bet.get("winnerTeam") == actual_winner

    points_gained = rules.get("correctWinnerPoints", 0) if correct_winner else 0

    if not correct_winner:
        return points_gained, 0

    # Margin points: only users who picked the correct winner are eligible.
    # Collect the absolute delta between each correct-winner bet and the actual diff.
    correct_winner_deltas = [
        abs(int(b["winMargin"] or 0) - actual_diff)
        for b in all_event_bets
        if b.get("winnerTeam") == actual_winner and b.get("winMargin") is not None
    ]

    if not correct_winner_deltas:
        return points_gained, 0

    min_delta = min(correct_winner_deltas)
    bet_delta = abs(int(bet.get("winMargin") or 0) - actual_diff)

    if bet_delta == 0:
        margin_pts = rules.get("correctScoreDifferenceExact", 0)
    elif bet_delta == min_delta:
        # All tied users at min delta receive the closest-margin points.
        margin_pts = rules.get("correctScoreDifferenceClosest", 0)
    else:
        margin_pts = 0

    return points_gained, margin_pts


def _calc_series_points(
    bet: dict,
    event: dict,
    rules: dict[str, int],
) -> tuple[int, int]:
    actual_winner = (
        event["team1"] if event["team1Score"] > event["team2Score"] else event["team2"]
    )
    actual_games = int(event.get("gameNumber") or 0)
    correct_winner = bet.get("winnerTeam") == actual_winner

    if not correct_winner:
        return 0, 0

    points_gained = rules.get("correctWinnerSeries", 0)

    # Bonus points if the user also predicted the exact number of games.
    # Stored additively so leaderboard can sum pointsGained + pointsGainedWinMargin.
    correct_games = bet.get("winMargin") is not None and int(bet["winMargin"]) == actual_games
    margin_pts = (
        rules.get("correctWinnerExactGames", 0) - points_gained if correct_games else 0
    )

    return points_gained, margin_pts
