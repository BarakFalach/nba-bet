from datetime import date, timezone, timedelta
from collections import defaultdict

# EDT (UTC-4) is in effect for the entire playoff window (April–June).
EASTERN = timezone(timedelta(hours=-4))

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
        dt = parse_date(game_date_str)
        # BDL datetimes are UTC. Convert to Eastern Time before extracting the
        # date so that late-night play-in games (e.g. 10pm ET = 02:00 UTC next
        # day) are not mis-classified as the following round.
        if dt.tzinfo is not None:
            dt = dt.astimezone(EASTERN)
        game_date = dt.date()
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

def compute_game_numbers(games: list[dict]) -> tuple[dict[int, int], dict[int, str]]:
    """
    For each game, compute its game number within the series (matchup) and
    its playoff round.  Returns two mappings keyed by BDL game_id:
      - game_number_map  : game_id -> game number (1-indexed within the matchup)
      - game_round_map   : game_id -> round name

    The round is derived from the matchup's *first* game, not each individual
    game's own date.  This handles the case where rounds overlap in the
    calendar (e.g. a first-round Game 7 on May 6 while second-round games
    have already started for other series).
    """
    # Group games by matchup (sorted team names to normalise home/away)
    matchups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for game in games:
        team_a = game["home_team"]["name"]
        team_b = game["visitor_team"]["name"]
        key = tuple(sorted([team_a, team_b]))
        matchups[key].append(game)

    game_number_map: dict[int, int] = {}
    game_round_map: dict[int, str] = {}
    for _key, matchup_games in matchups.items():
        # Sort by datetime so game 1 is earliest
        matchup_games.sort(key=lambda g: g.get("datetime") or g.get("date", ""))
        first_game_dt = matchup_games[0].get("datetime") or matchup_games[0].get("date", "")
        round_name = detect_round(first_game_dt)
        for idx, game in enumerate(matchup_games, start=1):
            game_number_map[game["id"]] = idx
            game_round_map[game["id"]] = round_name

    return game_number_map, game_round_map


# ---------------------------------------------------------------------------
# Map BDL game -> Supabase event row
# ---------------------------------------------------------------------------

def map_game_to_event(game: dict, game_number: int, round_name: str) -> dict:
    """Convert a BallDontLie game object to a Supabase event row.

    round_name must come from compute_game_numbers so that all games in a
    matchup share the round of the matchup's first game, rather than being
    classified individually by date (which breaks when rounds overlap).
    """
    bdl_status = game.get("status", "")
    period = game.get("period", 0)

    if bdl_status == "Final":
        status = STATUS_RESOLVED
    elif period > 0:
        status = STATUS_IN_PROGRESS
    else:
        status = STATUS_UPCOMING

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


def build_special_events(
    bdl_games: list[dict],
    existing_events_by_parse: dict[str, dict],
) -> tuple[list[dict], list[tuple[str, dict]]]:
    """
    Build finalsChampion and finalsMvp event rows.

    finalsChampion — created as soon as firstRound games are known.
      startTime = earliest firstRound game time (betting deadline).

    finalsMvp — created only once both conference finals series are resolved
      AND Finals games exist in BDL.
      startTime = earliest Finals game time (betting deadline).

    Returns (new_events, updates) in the same shape as build_series_events.
    """
    new_events: list[dict] = []
    updates: list[tuple[str, dict]] = []

    # -- finalsChampion --
    firstround_games = sorted(
        [g for g in bdl_games
         if detect_round(g.get("datetime") or g.get("date", "")) == "firstRound"],
        key=lambda g: g.get("datetime") or g.get("date", ""),
    )
    if firstround_games and "finalsChampion" not in existing_events_by_parse:
        deadline = firstround_games[0].get("datetime") or firstround_games[0].get("date", "")
        new_events.append({
            "id": "finalsChampion",
            "parentEvent": "finalsChampion",
            "team1": "",
            "team2": "",
            "team1Score": 0,
            "team2Score": 0,
            "startTime": deadline,
            "status": STATUS_UPCOMING,
            "eventType": "finalsChampion",
            "round": "finals",
            "gameNumber": 0,
            "season": APP_SEASON,
        })

    # -- finalsMvp --
    conference_resolved = [
        e for e in existing_events_by_parse.values()
        if e.get("round") == "conference"
        and e.get("eventType") == "series"
        and e.get("status") == STATUS_RESOLVED
    ]
    finals_games = sorted(
        [g for g in bdl_games
         if detect_round(g.get("datetime") or g.get("date", "")) == "finals"],
        key=lambda g: g.get("datetime") or g.get("date", ""),
    )
    if (
        len(conference_resolved) >= 2
        and finals_games
        and "finalsMvp" not in existing_events_by_parse
    ):
        def _winner(s: dict) -> str:
            return s["team1"] if s["team1Score"] > s["team2Score"] else s["team2"]

        t1 = _winner(conference_resolved[0])
        t2 = _winner(conference_resolved[1])
        deadline = finals_games[0].get("datetime") or finals_games[0].get("date", "")
        new_events.append({
            "id": "finalsMvp",
            "parentEvent": "finalsMvp",
            "team1": t1,
            "team2": t2,
            "team1Score": 0,
            "team2Score": 0,
            "startTime": deadline,
            "status": STATUS_UPCOMING,
            "eventType": "finalsMvp",
            "round": "finals",
            "gameNumber": 0,
            "season": APP_SEASON,
        })

    return new_events, updates


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
