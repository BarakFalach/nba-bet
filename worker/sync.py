import os
import sys
import time
from datetime import datetime, timezone

import httpx

from config import STATUS_UPCOMING, STATUS_RESOLVED, STATUS_IN_PROGRESS, APP_SEASON, TARGET_USER_IDS, EVENTS_ONLY, FINALS_CHAMPION_POINTS, FINALS_MVP_POINTS, FINALS_MVP_PLAYER_ID
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
    get_finals_mvp_event,
    fetch_finals_bets,
    fetch_finals_mvp_bets,
    update_special_bet_points,
)
from models import compute_game_numbers, map_game_to_event, build_series_events, build_special_events, calculate_points, detect_round
from finals_roster import sync_finals_rosters


# ---------------------------------------------------------------------------
# Structured output helpers
# ---------------------------------------------------------------------------

_GHA = os.environ.get("GITHUB_ACTIONS") == "true"
_TOTAL_STEPS = 7


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

    finals_mvp = get_finals_mvp_event(existing_by_parse)
    roster_sync_summary = ""
    if finals_mvp:
        try:
            newly_created_mvp = any(e.get("id") == "finalsMvp" for e in inserted_special)
            roster_sync = sync_finals_rosters(
                supabase,
                finals_mvp["team1"],
                finals_mvp["team2"],
                force=newly_created_mvp,
            )
            synced = [f"{team}+{count}" for team, count in roster_sync.items() if count > 0]
            if synced:
                roster_sync_summary = f" · rosters: {', '.join(synced)}"
        except Exception as exc:
            _error(f"Finals roster sync failed (continuing): {exc}")

    special_summary = f" · +{len(inserted_special)} special" if inserted_special else ""
    special_summary += roster_sync_summary
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

    # ------------------------------------------------------------------
    # Step 7: Score finals champion & MVP bets
    # ------------------------------------------------------------------
    finals_scored = 0

    # Merge existing_by_parse with resolved_event_states so we catch series
    # events that JUST became resolved in this run (their updated state is in
    # resolved_event_states but not yet reflected in existing_by_parse).
    all_events_this_run = {**existing_by_parse, **resolved_event_states}

    # Finals champion — auto-detect winner from resolved finals series event
    finals_series = next(
        (e for e in all_events_this_run.values()
         if e.get("eventType") == "series"
         and e.get("round") == "finals"
         and e.get("status") == STATUS_RESOLVED),
        None,
    )
    champion_event = all_events_this_run.get("finalsChampion")

    if finals_series and champion_event and champion_event.get("status") != STATUS_RESOLVED:
        actual_champion = (
            finals_series["team1"] if finals_series["team1Score"] > finals_series["team2Score"]
            else finals_series["team2"]
        )
        all_finals_bets = fetch_finals_bets(supabase)
        unscored = [b for b in all_finals_bets if b.get("pointsGained") is None]
        if unscored:
            champion_updates = [
                (b["id"], FINALS_CHAMPION_POINTS if b.get("finalsBet") == actual_champion else 0)
                for b in unscored
            ]
            update_special_bet_points(supabase, "finals_bet", champion_updates)
            finals_scored += len(champion_updates)
        update_event(supabase, "finalsChampion", {"status": STATUS_RESOLVED})

    # Finals MVP — requires FINALS_MVP_PLAYER_ID env var to be set
    mvp_event = all_events_this_run.get("finalsMvp")
    if FINALS_MVP_PLAYER_ID and mvp_event and mvp_event.get("status") != STATUS_RESOLVED:
        all_mvp_bets = fetch_finals_mvp_bets(supabase)
        unscored = [b for b in all_mvp_bets if b.get("pointsGained") is None]
        if unscored:
            mvp_updates = [
                (b["id"], FINALS_MVP_POINTS if b.get("playerId") == FINALS_MVP_PLAYER_ID else 0)
                for b in unscored
            ]
            update_special_bet_points(supabase, "finals_mvp_bet", mvp_updates)
            finals_scored += len(mvp_updates)
        update_event(supabase, "finalsMvp", {"status": STATUS_RESOLVED})

    finals_summary = f"{finals_scored} bets scored" if finals_scored else "—"
    _step(7, "Score finals bets", finals_summary)

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
