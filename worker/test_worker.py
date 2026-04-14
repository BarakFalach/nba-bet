"""
Tests for the NBA bet worker.

Run from the worker/ directory:
    python3 -m pytest test_worker.py -v
"""
import sys
import os

# Ensure the worker directory is on the path so imports resolve
sys.path.insert(0, os.path.dirname(__file__))


from models import (
    detect_round,
    detect_event_type,
    compute_game_numbers,
    map_game_to_event,
    build_series_events,
    calculate_points,
)
from sync import _should_create_bet
from config import STATUS_UPCOMING, STATUS_IN_PROGRESS, STATUS_RESOLVED


# ---------------------------------------------------------------------------
# Helpers – mock BDL game objects
# ---------------------------------------------------------------------------

def make_game(
    game_id: int,
    home: str,
    visitor: str,
    dt: str,
    status: str = "7:00 pm ET",
    period: int = 0,
    home_score: int = 0,
    visitor_score: int = 0,
) -> dict:
    """Build a minimal BallDontLie game dict for testing."""
    return {
        "id": game_id,
        "date": dt[:10],
        "datetime": dt,
        "status": status,
        "period": period,
        "postseason": True,
        "home_team_score": home_score,
        "visitor_team_score": visitor_score,
        "home_team": {"id": 1, "name": home, "full_name": f"Team {home}"},
        "visitor_team": {"id": 2, "name": visitor, "full_name": f"Team {visitor}"},
    }


# ---------------------------------------------------------------------------
# Round detection tests
# ---------------------------------------------------------------------------

class TestDetectRound:
    def test_playin_date(self):
        assert detect_round("2026-04-15T20:00:00Z") == "playin"

    def test_first_round_date(self):
        assert detect_round("2026-04-20T20:00:00Z") == "firstRound"

    def test_second_round_date(self):
        assert detect_round("2026-05-10T20:00:00Z") == "secondRound"

    def test_conference_finals_date(self):
        assert detect_round("2026-05-25T20:00:00Z") == "conference"

    def test_finals_date(self):
        assert detect_round("2026-06-10T20:00:00Z") == "finals"

    def test_before_playin_defaults_to_playin(self):
        assert detect_round("2026-04-10T20:00:00Z") == "playin"

    def test_after_finals_defaults_to_finals(self):
        assert detect_round("2026-07-01T20:00:00Z") == "finals"

    def test_boundary_playin_start(self):
        assert detect_round("2026-04-14T00:00:00Z") == "playin"

    def test_boundary_playin_end(self):
        assert detect_round("2026-04-17T23:59:59Z") == "playin"

    def test_boundary_first_round_start(self):
        assert detect_round("2026-04-18T00:00:00Z") == "firstRound"

    def test_invalid_date_falls_back(self):
        assert detect_round("not-a-date") == "firstRound"

    def test_empty_string_falls_back(self):
        assert detect_round("") == "firstRound"


# ---------------------------------------------------------------------------
# Event type detection tests
# ---------------------------------------------------------------------------

class TestDetectEventType:
    def test_playin_returns_playin(self):
        assert detect_event_type("playin") == "playin"

    def test_first_round_returns_game(self):
        assert detect_event_type("firstRound") == "game"

    def test_second_round_returns_game(self):
        assert detect_event_type("secondRound") == "game"

    def test_conference_returns_game(self):
        assert detect_event_type("conference") == "game"

    def test_finals_returns_game(self):
        assert detect_event_type("finals") == "game"


# ---------------------------------------------------------------------------
# Game number computation tests
# ---------------------------------------------------------------------------

class TestComputeGameNumbers:
    def test_single_matchup_numbered_chronologically(self):
        games = [
            make_game(100, "Celtics", "Lakers", "2026-04-20T23:00:00.000Z"),
            make_game(101, "Celtics", "Lakers", "2026-04-22T23:00:00.000Z"),
            make_game(102, "Lakers", "Celtics", "2026-04-24T23:00:00.000Z"),
        ]
        result = compute_game_numbers(games)
        assert result[100] == 1
        assert result[101] == 2
        assert result[102] == 3

    def test_two_matchups_numbered_independently(self):
        games = [
            make_game(100, "Celtics", "Lakers", "2026-04-20T23:00:00.000Z"),
            make_game(101, "Celtics", "Lakers", "2026-04-22T23:00:00.000Z"),
            make_game(200, "Warriors", "Thunder", "2026-04-20T20:00:00.000Z"),
        ]
        result = compute_game_numbers(games)
        assert result[100] == 1
        assert result[101] == 2
        assert result[200] == 1

    def test_home_away_swap_same_matchup(self):
        """Games between same teams count as one matchup regardless of home/away."""
        games = [
            make_game(100, "Celtics", "Lakers", "2026-04-20T23:00:00.000Z"),
            make_game(101, "Lakers", "Celtics", "2026-04-22T23:00:00.000Z"),
        ]
        result = compute_game_numbers(games)
        assert result[100] == 1
        assert result[101] == 2

    def test_single_game(self):
        games = [make_game(100, "Heat", "Bucks", "2026-04-20T20:00:00.000Z")]
        result = compute_game_numbers(games)
        assert result[100] == 1


# ---------------------------------------------------------------------------
# Game-to-event mapping tests
# ---------------------------------------------------------------------------

class TestMapGameToEvent:
    def test_finished_game(self):
        game = make_game(
            100, "Celtics", "Lakers", "2026-04-20T23:00:00.000Z",
            status="Final", period=4, home_score=110, visitor_score=98,
        )
        ev = map_game_to_event(game, game_number=1)

        assert ev["id"] == "100"
        assert ev["team1"] == "Celtics"
        assert ev["team2"] == "Lakers"
        assert ev["team1Score"] == 110
        assert ev["team2Score"] == 98
        assert ev["status"] == STATUS_RESOLVED
        assert ev["eventType"] == "game"
        assert ev["round"] == "firstRound"
        assert ev["gameNumber"] == 1
        assert ev["season"] == 2026
        assert ev["parentEvent"] == "100"

    def test_upcoming_game(self):
        game = make_game(
            101, "Celtics", "Lakers", "2026-04-22T23:00:00.000Z",
            status="7:00 pm ET", period=0,
        )
        ev = map_game_to_event(game, game_number=2)

        assert ev["status"] == STATUS_UPCOMING
        assert ev["team1Score"] == 0
        assert ev["team2Score"] == 0
        assert ev["gameNumber"] == 2

    def test_in_progress_game(self):
        game = make_game(
            102, "Warriors", "Thunder", "2026-04-20T20:00:00.000Z",
            status="3rd Qtr", period=3, home_score=78, visitor_score=72,
        )
        ev = map_game_to_event(game, game_number=1)

        assert ev["status"] == STATUS_IN_PROGRESS
        assert ev["team1Score"] == 78
        assert ev["team2Score"] == 72

    def test_playin_game(self):
        game = make_game(
            200, "Heat", "Bulls", "2026-04-15T23:00:00.000Z",
            status="7:00 pm ET", period=0,
        )
        ev = map_game_to_event(game, game_number=1)

        assert ev["eventType"] == "playin"
        assert ev["round"] == "playin"

    def test_finals_game(self):
        game = make_game(
            300, "Celtics", "Warriors", "2026-06-05T01:00:00.000Z",
            status="Final", period=4, home_score=105, visitor_score=99,
        )
        ev = map_game_to_event(game, game_number=3)

        assert ev["round"] == "finals"
        assert ev["eventType"] == "game"
        assert ev["gameNumber"] == 3


# ---------------------------------------------------------------------------
# Series-level event tests
# ---------------------------------------------------------------------------

class TestBuildSeriesEvents:
    def test_new_series_from_games(self):
        games = [
            make_game(
                100, "Celtics", "Lakers", "2026-04-20T23:00:00.000Z",
                status="Final", period=4, home_score=110, visitor_score=98,
            ),
            make_game(
                101, "Celtics", "Lakers", "2026-04-22T23:00:00.000Z",
                status="7:00 pm ET", period=0,
            ),
            make_game(
                200, "Warriors", "Thunder", "2026-04-20T20:00:00.000Z",
                status="Final", period=4, home_score=105, visitor_score=102,
            ),
        ]
        new_series, updates = build_series_events(games, {})

        assert len(new_series) == 2
        assert len(updates) == 0

    def test_series_win_counting(self):
        games = [
            make_game(
                100, "Celtics", "Lakers", "2026-04-20T23:00:00.000Z",
                status="Final", period=4, home_score=110, visitor_score=98,
            ),
            make_game(
                101, "Celtics", "Lakers", "2026-04-22T23:00:00.000Z",
                status="7:00 pm ET", period=0,
            ),
        ]
        new_series, _ = build_series_events(games, {})

        cel_lak = [s for s in new_series if s["team1"] == "Celtics"][0]
        assert cel_lak["team1Score"] == 1  # Celtics won game 1
        assert cel_lak["team2Score"] == 0
        assert cel_lak["eventType"] == "series"
        assert cel_lak["status"] == STATUS_IN_PROGRESS

    def test_series_resolved_at_4_wins(self):
        games = []
        for i in range(4):
            games.append(make_game(
                100 + i, "Celtics", "Lakers",
                f"2026-04-{20 + i * 2}T23:00:00.000Z",
                status="Final", period=4, home_score=110, visitor_score=98,
            ))
        new_series, _ = build_series_events(games, {})

        cel_lak = new_series[0]
        assert cel_lak["team1Score"] == 4
        assert cel_lak["status"] == STATUS_RESOLVED

    def test_playin_series_resolved_at_1_win(self):
        games = [
            make_game(
                300, "Heat", "Bulls", "2026-04-15T23:00:00.000Z",
                status="Final", period=4, home_score=105, visitor_score=99,
            ),
        ]
        new_series, _ = build_series_events(games, {})

        series = new_series[0]
        assert series["status"] == STATUS_RESOLVED  # 1 win clinches play-in

    def test_series_upcoming_no_games_finished(self):
        games = [
            make_game(100, "Celtics", "Lakers", "2026-04-20T23:00:00.000Z"),
            make_game(101, "Celtics", "Lakers", "2026-04-22T23:00:00.000Z"),
        ]
        new_series, _ = build_series_events(games, {})

        assert new_series[0]["status"] == STATUS_UPCOMING
        assert new_series[0]["team1Score"] == 0
        assert new_series[0]["team2Score"] == 0

    def test_existing_series_gets_updated(self):
        games = [
            make_game(
                100, "Celtics", "Lakers", "2026-04-20T23:00:00.000Z",
                status="Final", period=4, home_score=110, visitor_score=98,
            ),
        ]
        existing = {
            "series_Celtics_Lakers": {
                "id": "series_Celtics_Lakers",
                "team1Score": 0,
                "team2Score": 0,
                "status": STATUS_UPCOMING,
            }
        }
        new_series, updates = build_series_events(games, existing)

        assert len(new_series) == 0
        assert len(updates) == 1
        event_id, update_data = updates[0]
        assert event_id == "series_Celtics_Lakers"
        assert update_data["team1Score"] == 1
        assert update_data["status"] == STATUS_IN_PROGRESS

    def test_game_number_equals_games_played_not_total_rows(self):
        """gameNumber should be wins sum (games played), not len(matchup_games)."""
        # 4-2 series: 6 finished games + 1 extra upcoming row (should be ignored)
        games = []
        for i in range(4):  # Celtics win 4
            games.append(make_game(100 + i, "Celtics", "Lakers",
                f"2026-04-{20 + i * 2}T23:00:00.000Z",
                status="Final", period=4, home_score=110, visitor_score=98))
        for i in range(2):  # Lakers win 2
            games.append(make_game(200 + i, "Lakers", "Celtics",
                f"2026-04-{21 + i * 2}T23:00:00.000Z",
                status="Final", period=4, home_score=105, visitor_score=98))
        # Upcoming game 7 that never happens
        games.append(make_game(300, "Celtics", "Lakers", "2026-04-30T23:00:00.000Z"))

        new_series, _ = build_series_events(games, {})
        assert new_series[0]["gameNumber"] == 6  # 4+2, not 7 (len of matchup_games)

    def test_game_number_sweep(self):
        games = []
        for i in range(4):
            games.append(make_game(100 + i, "Celtics", "Lakers",
                f"2026-04-{20 + i * 2}T23:00:00.000Z",
                status="Final", period=4, home_score=110, visitor_score=98))
        new_series, _ = build_series_events(games, {})
        assert new_series[0]["gameNumber"] == 4

    def test_series_parse_key_is_alphabetically_sorted(self):
        """Ensure the series key is consistent regardless of home/away order."""
        games = [
            make_game(100, "Warriors", "Celtics", "2026-04-20T20:00:00.000Z"),
        ]
        new_series, _ = build_series_events(games, {})

        assert new_series[0]["parentEvent"] == "series_Celtics_Warriors"
        assert new_series[0]["id"] == "series_Celtics_Warriors"


# ---------------------------------------------------------------------------
# Helpers for calculate_points tests
# ---------------------------------------------------------------------------

def make_event(
    team1: str,
    team2: str,
    team1_score: int,
    team2_score: int,
    event_type: str = "game",
    round_name: str = "firstRound",
    game_number: int = 1,
) -> dict:
    return {
        "team1": team1,
        "team2": team2,
        "team1Score": team1_score,
        "team2Score": team2_score,
        "eventType": event_type,
        "round": round_name,
        "gameNumber": game_number,
        "status": STATUS_RESOLVED,
    }


def make_bet(winner_team: str | None, win_margin: int | None, bet_id: str = "b1") -> dict:
    return {
        "id": bet_id,
        "winnerTeam": winner_team,
        "winMargin": win_margin,
    }


# ---------------------------------------------------------------------------
# calculate_points tests
# ---------------------------------------------------------------------------

class TestCalculatePointsGame:
    """Game and play-in event scoring."""

    def _game_event(self, round_name: str = "conference") -> dict:
        # Celtics win 110-100 → actual_diff = 10
        return make_event("Celtics", "Lakers", 110, 100, event_type="game", round_name=round_name)

    def test_correct_winner_gets_winner_points(self):
        event = self._game_event()
        bet = make_bet("Celtics", 5)
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 2  # conference correctWinnerPoints

    def test_wrong_winner_gets_zero(self):
        event = self._game_event()
        bet = make_bet("Lakers", 10)
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 0
        assert margin == 0

    def test_exact_margin_gets_exact_points(self):
        event = self._game_event()
        bet = make_bet("Celtics", 10)  # exact diff
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 2
        assert margin == 4  # conference correctScoreDifferenceExact

    def test_closest_margin_gets_closest_points(self):
        event = self._game_event()
        bet_a = make_bet("Celtics", 8, "b1")   # delta=2 (closest)
        bet_b = make_bet("Celtics", 15, "b2")  # delta=5
        pts, margin = calculate_points(bet_a, event, [bet_a, bet_b])
        assert pts == 2
        assert margin == 3  # conference correctScoreDifferenceClosest

    def test_not_closest_gets_zero_margin(self):
        event = self._game_event()
        bet_a = make_bet("Celtics", 8, "b1")   # delta=2
        bet_b = make_bet("Celtics", 15, "b2")  # delta=5 (not closest)
        pts, margin = calculate_points(bet_b, event, [bet_a, bet_b])
        assert pts == 2
        assert margin == 0

    def test_tied_closest_all_get_points(self):
        event = self._game_event()
        bet_a = make_bet("Celtics", 8, "b1")  # delta=2
        bet_b = make_bet("Celtics", 12, "b2") # delta=2 — tied
        _, margin_a = calculate_points(bet_a, event, [bet_a, bet_b])
        _, margin_b = calculate_points(bet_b, event, [bet_a, bet_b])
        assert margin_a == 3
        assert margin_b == 3

    def test_wrong_winner_ineligible_for_margin(self):
        event = self._game_event()
        bet_wrong = make_bet("Lakers", 10, "b1")  # exact diff but wrong winner
        bet_right = make_bet("Celtics", 15, "b2")
        # Even though Lakers bet has exact diff, they picked the wrong team
        pts, margin = calculate_points(bet_wrong, event, [bet_wrong, bet_right])
        assert pts == 0
        assert margin == 0

    def test_playin_scoring_scale(self):
        event = make_event("Heat", "Bulls", 105, 99, event_type="playin", round_name="playin")
        bet = make_bet("Heat", 6)  # exact diff
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 2   # playin correctWinnerPoints
        assert margin == 4  # playin correctScoreDifferenceExact

    def test_finals_scoring_scale(self):
        event = make_event("Celtics", "Warriors", 115, 105, event_type="game", round_name="finals")
        bet = make_bet("Celtics", 10)  # exact diff
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 4    # finals correctWinnerPoints
        assert margin == 8  # finals correctScoreDifferenceExact


class TestCalculatePointsSeries:
    """Series event scoring."""

    def _series_event(self, round_name: str = "firstRound", game_number: int = 6) -> dict:
        # Celtics win series 4-2 (6 games total)
        return make_event(
            "Celtics", "Lakers", 4, 2,
            event_type="series", round_name=round_name, game_number=game_number,
        )

    def test_correct_winner_gets_series_points(self):
        event = self._series_event()
        bet = make_bet("Celtics", 7)  # wrong games count
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 4   # firstRound correctWinnerSeries
        assert margin == 0

    def test_correct_winner_and_games_gets_bonus(self):
        event = self._series_event()
        bet = make_bet("Celtics", 6)  # exact games count
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 4
        assert margin == 2  # 6 - 4 = bonus (total = correctWinnerExactGames)
        assert pts + margin == 6  # firstRound correctWinnerExactGames

    def test_wrong_winner_gets_zero(self):
        event = self._series_event()
        bet = make_bet("Lakers", 6)
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 0
        assert margin == 0

    def test_finals_series_scale(self):
        event = self._series_event(round_name="finals", game_number=7)
        bet = make_bet("Celtics", 7)  # correct winner + exact games
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 12   # finals correctWinnerSeries
        assert pts + margin == 16  # finals correctWinnerExactGames

    def test_second_round_scale(self):
        event = self._series_event(round_name="secondRound", game_number=5)
        bet = make_bet("Celtics", 5)
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 8
        assert pts + margin == 12

    def test_unplaced_bet_handled_by_caller(self):

        # calculate_points is only called for placed bets (winnerTeam is not None).
        # This test documents the behaviour if somehow called with None.
        event = self._series_event()
        bet = make_bet(None, None)
        pts, margin = calculate_points(bet, event, [bet])
        assert pts == 0
        assert margin == 0


# ---------------------------------------------------------------------------
# _should_create_bet tests
# ---------------------------------------------------------------------------

class TestShouldCreateBet:
    def _ev(self, round_name: str, event_type: str) -> dict:
        return {"round": round_name, "eventType": event_type}

    def test_first_round_series_true(self):
        assert _should_create_bet(self._ev("firstRound", "series")) is True

    def test_first_round_game_false(self):
        assert _should_create_bet(self._ev("firstRound", "game")) is False

    def test_second_round_series_true(self):
        assert _should_create_bet(self._ev("secondRound", "series")) is True

    def test_second_round_game_false(self):
        assert _should_create_bet(self._ev("secondRound", "game")) is False

    def test_playin_game_true(self):
        assert _should_create_bet(self._ev("playin", "playin")) is True

    def test_conference_game_true(self):
        assert _should_create_bet(self._ev("conference", "game")) is True

    def test_conference_series_true(self):
        assert _should_create_bet(self._ev("conference", "series")) is True

    def test_finals_game_true(self):
        assert _should_create_bet(self._ev("finals", "game")) is True

    def test_finals_series_true(self):
        assert _should_create_bet(self._ev("finals", "series")) is True
