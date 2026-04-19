import os
import sys
import time
from datetime import datetime, timezone

import httpx

from config import STATUS_UPCOMING, STATUS_RESOLVED, STATUS_IN_PROGRESS, APP_SEASON, TARGET_USER_IDS, EVENTS_ONLY
from bdl_client import fetch_bdl_games
from supabase_client import (
    get_supabase_client,
    fetch_existing_events,
    insert_events,
    update_event,
    fetch_all_user_ids,
    fetch_existing_bet_pairs,
    fetch_event_bets,
    fetch_unscored_resolved_event_ids,
    insert_bets,
    update_bets_points,
)
from models import compute_game_numbers, map_game_to_event, build_series_events, build_special_events, calculate_points, detect_round


# ---------------------------------------------------------------------------
# Structured output helpers
# ---------------------------------------------------------------------------

_GHA = os.environ.get("GITHUB_ACTIONS") == "true"
_TOTAL_STEPS = 6


def _header(title: str) -> None:
    if _GHA:
        print(f"::group::{title}", flush=True)
    else:
        bar = "═" * 58
        print(f"\n{bar}\n  {title}\n{bar}", flush=True)


def _step(num: int, label: str, summary: str) -> None:
    pad = "." * max(1, 32 - len(label))
    print(f"  [{num}/{_TOTAL_STEPS}] {label} {pad} {summary}", flush=True)


def _footer(elapsed: float) -> None:
    print(f"\n  ✓ Done in {elapsed:.1f}s", flush=True)
    if _GHA:
        print("::endgroup::", flush=True)
    else:
        print("═" * 58, flush=True)


def _error(msg: str) -> None:
    if _GHA:
        print("::endgroup::", flush=True)
        print(f"::error::{msg}", flush=True)
    else:
        print(f"\n  ✗ {msg}", file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _should_create_bet(event: dict) -> bool:
    """
    Returns True only for event types that users actually bet on per round:
      play-in:           playin/game events (no series — none exist anyway)
      firstRound/second: series events only (users bet on the series, not games)
      conference/finals: both game and series events
      finalsChampion / finalsMvp: bets live in finals_bet / finals_mvp_bet tables
    """
    event_type = event.get("eventType", "")
    if event_type in ("finalsChampion", "finalsMvp"):
        return False
    round_name = event.get("round", "")
    if round_name == "playin":
        return event_type != "series"   # play-in has no series, only individual games
    if round_name in ("firstRound", "secondRound"):
        return event_type == "series"
    return True


# ---------------------------------------------------------------------------
# Main sync pipeline
# ---------------------------------------------------------------------------

async def sync_all() -> dict:
    """
    Full sync pipeline:
      1. Fetch games from BallDontLie API
      2. Load existing events & bet coverage from Supabase
      3. Sync game-level events (create new / update scores & status)
      4. Sync series-level events (create new / update win counts & status)
      5. Create bet rows for all users on newly added events
      6. Score resolved events — write pointsGained / pointsGainedWinMargin
    """
    start = time.monotonic()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    flags = []
    if EVENTS_ONLY:
        flags.append("EVENTS_ONLY")
    if TARGET_USER_IDS:
        flags.append(f"TARGET_USER_IDS={','.join(TARGET_USER_IDS)}")
    mode = f"  [{', '.join(flags)}]" if flags else ""
    _header(f"NBA Bet Sync — {now}{mode}")

    supabase = get_supabase_client()

    # ------------------------------------------------------------------
    # Step 1: Fetch games from BallDontLie
    # ------------------------------------------------------------------
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            bdl_games = await fetch_bdl_games(client)
    except httpx.HTTPStatusError as exc:
        _error(f"BallDontLie API error {exc.response.status_code}: {exc.response.text[:200]}")
        raise

    _step(1, "Fetch games", f"{len(bdl_games)} games")

    if not bdl_games:
        _step(2, "Load events & bets", "skipped — no games")
        for n in range(3, _TOTAL_STEPS + 1):
            _step(n, ["Sync game events", "Sync series events",
                      "Create bets", "Score resolved bets"][n - 3], "—")
        _footer(time.monotonic() - start)
        return {"games_fetched": 0, "events_created": 0, "events_updated": 0,
                "series_created": 0, "series_updated": 0, "bets_created": 0, "bets_scored": 0}

    # ------------------------------------------------------------------
    # Step 2: Load existing events & bet coverage
    # ------------------------------------------------------------------
    existing_events = fetch_existing_events(supabase)
    existing_bet_pairs = fetch_existing_bet_pairs(supabase)

    # Build lookup: parentEvent key → event dict (used for create/update decisions)
    existing_by_parse: dict[str, dict] = {
        str(e["parentEvent"]): e for e in existing_events if e.get("parentEvent")
    }
    _step(2, "Load events & bets",
          f"{len(existing_events)} events · {len(existing_bet_pairs)} bets")

    # Compute game numbers and rounds within each matchup.
    # Round is derived from the matchup's first game so that a late Game 7
    # isn't mis-classified as the next round when calendar windows overlap.
    game_number_map, game_round_map = compute_game_numbers(bdl_games)

    # Track events that resolved in this run — needed for Step 6
    resolved_event_states: dict[str, dict] = {}

    # ------------------------------------------------------------------
    # Step 3: Sync game-level events
    # ------------------------------------------------------------------
    new_game_events: list[dict] = []
    game_updated = 0

    for game in bdl_games:
        parse_key = str(game["id"])
        game_number = game_number_map.get(game["id"], 1)
        round_name = game_round_map.get(game["id"], "firstRound")
        existing = existing_by_parse.get(parse_key)

        if existing is None:
            new_game_events.append(map_game_to_event(game, game_number, round_name))
        else:
            bdl_status = game.get("status", "")
            period = game.get("period", 0)
            db_status = existing.get("status", STATUS_UPCOMING)
            update_data: dict = {}

            if bdl_status == "Final" and db_status != STATUS_RESOLVED:
                update_data = {
                    "status": STATUS_RESOLVED,
                    "team1Score": game.get("home_team_score", 0) or 0,
                    "team2Score": game.get("visitor_team_score", 0) or 0,
                }
                resolved_event_states[existing["id"]] = {**existing, **update_data}
            elif period > 0 and bdl_status != "Final" and db_status == STATUS_UPCOMING:
                update_data = {
                    "status": STATUS_IN_PROGRESS,
                    "team1Score": game.get("home_team_score", 0) or 0,
                    "team2Score": game.get("visitor_team_score", 0) or 0,
                }

            if update_data:
                update_event(supabase, existing["id"], update_data)
                game_updated += 1

    inserted_games: list[dict] = []
    if new_game_events:
        inserted_games = insert_events(supabase, new_game_events)
        for ev in inserted_games:
            if ev.get("parentEvent"):
                existing_by_parse[str(ev["parentEvent"])] = ev

    _step(3, "Sync game events",
          f"+{len(inserted_games)} new · {game_updated} updated")

    # ------------------------------------------------------------------
    # Step 4: Sync series-level events (play-in has no series)
    # ------------------------------------------------------------------
    non_playin_games = [
        g for g in bdl_games
        if detect_round(g.get("datetime") or g.get("date", "")) != "playin"
    ]
    new_series, series_updates = build_series_events(non_playin_games, existing_by_parse)

    inserted_series: list[dict] = []
    if new_series:
        inserted_series = insert_events(supabase, new_series)
        for ev in inserted_series:
            if ev.get("parentEvent"):
                existing_by_parse[str(ev["parentEvent"])] = ev

    for event_id, update_data in series_updates:
        update_event(supabase, event_id, update_data)
        if update_data.get("status") == STATUS_RESOLVED:
            existing_series = existing_by_parse.get(event_id)
            if existing_series:
                resolved_event_states[event_id] = {**existing_series, **update_data}

    # Special events: finalsChampion deadline anchor + finalsMvp (once conference finals resolve)
    new_special, special_updates = build_special_events(bdl_games, existing_by_parse)
    inserted_special: list[dict] = []
    if new_special:
        inserted_special = insert_events(supabase, new_special)
        for ev in inserted_special:
            if ev.get("parentEvent"):
                existing_by_parse[str(ev["parentEvent"])] = ev
    for event_id, update_data in special_updates:
        update_event(supabase, event_id, update_data)

    special_summary = f" · +{len(inserted_special)} special" if inserted_special else ""
    _step(4, "Sync series events",
          f"+{len(inserted_series)} new · {len(series_updates)} updated{special_summary}")

    # ------------------------------------------------------------------
    # Step 5: Create bets for newly added events
    # ------------------------------------------------------------------
    if EVENTS_ONLY:
        _step(5, "Create bets", "skipped [EVENTS_ONLY]")
        _step(6, "Score resolved bets", "skipped [EVENTS_ONLY]")
        _footer(time.monotonic() - start)
        return {
            "games_fetched": len(bdl_games),
            "events_created": len(inserted_games),
            "events_updated": game_updated,
            "series_created": len(inserted_series),
            "series_updated": len(series_updates),
            "bets_created": 0,
            "bets_scored": 0,
        }

    all_user_ids = fetch_all_user_ids(supabase)
    # Restrict to specific users when TARGET_USER_IDS is set (preview / test mode).
    target_ids = TARGET_USER_IDS if TARGET_USER_IDS else all_user_ids

    # All current-season events (existing + newly inserted) that target users may be missing bets on.
    all_current_events = list(existing_by_parse.values())

    bet_rows: list[dict] = []
    for ev in all_current_events:
        ev_id = ev.get("id")
        if not ev_id or not _should_create_bet(ev):
            continue
        for user_id in target_ids:
            if (ev_id, str(user_id)) not in existing_bet_pairs:
                bet_rows.append({
                "eventId": ev["id"],
                "userId": user_id,
                "closeTime": ev.get("startTime"),
                "eventType": ev.get("eventType"),
                "calcFunc": ev.get("round"),
            })

    bets_created = insert_bets(supabase, bet_rows)
    user_label = f"{len(target_ids)} users" + (" [restricted]" if TARGET_USER_IDS else "")
    bets_summary = f"+{bets_created} bets ({user_label})" if bets_created else "—"
    _step(5, "Create bets", bets_summary)

    # ------------------------------------------------------------------
    # Step 6: Score resolved events
    # ------------------------------------------------------------------
    bets_scored = 0
    events_scored = 0

    # Include events that were already resolved in a previous run but still
    # have unscored bets (e.g. bets created after the event resolved).
    for skipped_id in fetch_unscored_resolved_event_ids(supabase):
        if skipped_id not in resolved_event_states:
            event_state = existing_by_parse.get(skipped_id)
            if event_state:
                resolved_event_states[skipped_id] = event_state

    for event_id, event_state in resolved_event_states.items():
        all_bets = fetch_event_bets(supabase, event_id)
        placed_bets = [b for b in all_bets if b.get("winnerTeam") is not None]

        if not placed_bets:
            continue

        point_updates = [
            (
                bet["id"],
                {
                    "pointsGained": pts,
                    "pointsGainedWinMargin": pts_margin,
                },
            )
            for bet in placed_bets
            for pts, pts_margin in [calculate_points(bet, event_state, all_bets)]
        ]

        update_bets_points(supabase, point_updates)
        bets_scored += len(point_updates)
        events_scored += 1

    score_summary = (
        f"{bets_scored} bets scored ({events_scored} events)" if bets_scored else "—"
    )
    _step(6, "Score resolved bets", score_summary)

    _footer(time.monotonic() - start)

    return {
        "games_fetched": len(bdl_games),
        "events_created": len(inserted_games),
        "events_updated": game_updated,
        "series_created": len(inserted_series),
        "series_updated": len(series_updates),
        "bets_created": bets_created,
        "bets_scored": bets_scored,
    }
