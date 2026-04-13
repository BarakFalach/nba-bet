# Plan: Fully Automated NBA Bet Flow via GitHub Actions

## Context

The existing AWS Lambda worker only syncs game events (create/update). Two major pieces are missing:

1. **Bet creation** — when a new event appears, no bet rows are created for users
2. **Bet scoring** — when an event resolves, `pointsGained` / `pointsGainedWinMargin` are never written

This plan migrates the worker from AWS Lambda to a GitHub Actions workflow (free, manually triggerable, cron-schedulable) and adds both missing features with clean, structured log output.

---

## Files Changed

| Action | File |
|--------|------|
| Create | `.github/workflows/sync.yml` |
| Create | `worker/run.py` |
| Modify | `worker/sync.py` |
| Modify | `worker/supabase_client.py` |
| Modify | `worker/models.py` |
| Modify | `worker/config.py` |
| Modify | `worker/test_worker.py` |
| Delete | `worker/lambda_function.py` |

---

## Step 1 — `.github/workflows/sync.yml`

```yaml
name: NBA Bet Sync

on:
  schedule:
    - cron: '*/15 17-23 * 4-6 *'   # every 15 min, 5pm–midnight UTC (playoffs)
    - cron: '*/15 0-5 * 4-6 *'     # every 15 min, midnight–5am UTC (late games)
  workflow_dispatch:
    inputs:
      test_mode:
        description: 'Run in TEST_MODE (regular season data)'
        type: boolean
        default: false

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install -r worker/requirements.txt
      - name: Run sync
        working-directory: worker
        run: python run.py
        env:
          BALL_DONT_LIE_API_KEY: ${{ secrets.BALL_DONT_LIE_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          TEST_MODE: ${{ inputs.test_mode || 'false' }}
```

---

## Step 2 — `worker/run.py` (replaces `lambda_function.py`)

Simple entrypoint — exits with code 1 on failure so GitHub Actions marks the run as failed.

```python
import asyncio, sys, time
from sync import sync_all

start = time.time()
result = asyncio.run(sync_all())
sys.exit(0 if result else 1)
```

`sync_all()` is a renamed/extended version of `sync_events()` that runs all 6 steps.

---

## Step 3 — `worker/supabase_client.py` additions

Four new functions (existing ones unchanged):

| Function | Purpose |
|----------|---------|
| `fetch_all_user_ids(supabase)` | `SELECT uuid FROM users` → `list[str]` |
| `fetch_event_bets(supabase, event_id)` | All bets for one event → `list[dict]` |
| `fetch_existing_bet_event_ids(supabase, season)` | Set of event IDs that already have bets |
| `insert_bets(supabase, bets)` | Bulk INSERT into `bets` table → count |
| `update_bets_points(supabase, updates)` | Write `pointsGained`/`pointsGainedWinMargin` for list of `(id, data)` |

---

## Step 4 — `worker/models.py` additions

### Scoring constants (added to `config.py` as `SCORING`)

Mirrors `PredictionResultPerType` from `frontend/src/types/events.ts`:

```python
SCORING = {
    "playin":      {"correctWinnerPoints": 2, "correctScoreDifferenceExact": 4, "correctScoreDifferenceClosest": 3},
    "firstRound":  {"correctWinnerSeries": 4, "correctWinnerExactGames": 6},
    "secondRound": {"correctWinnerSeries": 8, "correctWinnerExactGames": 12},
    "conference":  {"correctWinnerSeries": 8, "correctWinnerExactGames": 12, "correctWinnerPoints": 2, "correctScoreDifferenceExact": 4, "correctScoreDifferenceClosest": 3},
    "finals":      {"correctWinnerSeries": 12, "correctWinnerExactGames": 16, "correctWinnerPoints": 4, "correctScoreDifferenceExact": 8, "correctScoreDifferenceClosest": 6},
}
```

### `calculate_points(bet, event, all_event_bets) → tuple[int, int]`

Returns `(pointsGained, pointsGainedWinMargin)`.

**Game / play-in events** (`eventType` = `'game'` or `'playin'`):
- `actual_winner` = team with higher score
- `actual_diff` = `abs(team1Score - team2Score)`
- `pointsGained` = `correctWinnerPoints` if bet picked correct winner, else `0`
- Margin eligibility: only users who picked the **correct winner**
  - `bet_delta` = `abs(bet["winMargin"] - actual_diff)`
  - `min_delta` = minimum delta across all correct-winner bets
  - `pointsGainedWinMargin`:
    - `bet_delta == 0` → `correctScoreDifferenceExact`
    - `bet_delta == min_delta` → `correctScoreDifferenceClosest`
    - otherwise → `0`

**Series events** (`eventType` = `'series'`):
- `actual_winner` = team with more wins (`team1Score` / `team2Score`)
- `actual_games` = `event["gameNumber"]` (total games in series)
- `pointsGained` = `correctWinnerSeries` if correct winner, else `0`
- `pointsGainedWinMargin` = `correctWinnerExactGames − correctWinnerSeries` if correct winner **and** `winMargin == actual_games`, else `0`
  - (additive: total = `correctWinnerExactGames` for a perfect prediction)

---

## Step 5 — `worker/sync.py` restructure

Rename `sync_events()` → `sync_all()`. Add two new steps at the end.

```
Step 1: Fetch games from BallDontLie          → N games
Step 2: Load existing Supabase events         → N events, N bets
Step 3: Sync game events                      → +N new  ·  N updated
Step 4: Sync series events                    → +N new  ·  N updated
Step 5: Create bets for new events            → +N bets across N events   ← NEW
Step 6: Score resolved events                 → N bets scored across N events   ← NEW
```

**Step 5 — bet creation:**
- `events_needing_bets` = newly inserted events from steps 3/4 + any existing events missing bets (checked via `fetch_existing_bet_event_ids`)
- Per user per event, build a row:
  ```python
  {
      "eventId": event["id"],
      "userId": user_id,
      "closeTime": event["startTime"],
      "eventType": event["eventType"],
      "calcFunc": event["eventType"],
      "winnerTeam": None, "winMargin": None,
      "result": None, "pointsGained": None, "pointsGainedWinMargin": None,
  }
  ```
- Bulk insert via `insert_bets()`

**Step 6 — bet scoring:**
- `resolved_this_run` = events that transitioned to `STATUS_RESOLVED` during this run (tracked in step 3/4)
- For each resolved event:
  - `all_bets = fetch_event_bets(supabase, event_id)`
  - Skip bets where `winnerTeam is None` (user never placed)
  - Call `calculate_points(bet, event, all_bets)` for each placed bet
  - Collect `(bet_id, {pointsGained, pointsGainedWinMargin})`
  - Write via `update_bets_points()`

---

## Step 6 — Logging design

Use GitHub Actions native `::group::` / `::endgroup::` commands to make the entire run **collapsible** in the UI. Errors are printed **outside** the group so they're always visible.

**Output format:**

```
::group::NBA Bet Sync — 2026-04-12 20:15 UTC  (TEST_MODE=off)

  [1/6] BallDontLie API ............. 45 games fetched
  [2/6] Supabase load ............... 38 events  ·  420 bets
  [3/6] Game events ................. +7 new  ·  3 updated
  [4/6] Series events ............... +2 new  ·  5 updated
  [5/6] Bet creation ................ +63 bets  (9 events × 7 users)
  [6/6] Bet scoring ................. 14 bets scored  (2 events resolved)

  ✓ Completed in 2.4s

::endgroup::
```

- If nothing changed: single line `· No changes` replaces steps 3–6
- All `logger.info()` calls replaced by this structured printer — no raw log spam

---

## Step 7 — Tests (`worker/test_worker.py` additions)

New class `TestCalculatePoints`:

| Test | Covers |
|------|--------|
| correct winner → `correctWinnerPoints` | game basic |
| correct winner + exact margin | game exact diff |
| correct winner + closest margin | `correctScoreDifferenceClosest` |
| incorrect winner → 0 pts | game miss |
| correct winner but not closest | 0 margin pts |
| series: correct winner only | `correctWinnerSeries` |
| series: correct winner + correct games | full series points |
| series: wrong winner | 0 pts |
| finals vs firstRound — point values differ | scaling |
| tied closest margin — all tied users score | tie-break |

---

## Step 8 — `worker/README.md`

A short README covering:
- **What the worker does** — 6-step pipeline overview (fetch → sync events → create bets → score bets)
- **Running locally**:
  ```bash
  cd worker
  cp .env.example .env   # fill in API keys
  pip install -r requirements.txt
  python run.py          # full run
  TEST_MODE=true python run.py  # safe test run with regular-season data
  pytest test_worker.py -v      # run unit tests
  ```
- **Environment variables** table (name, purpose, where to get it)
- **TEST_MODE explanation** — fetches last 7 days of regular-season games instead of live playoff data; safe to run any time of year
- **GitHub Actions** — how the cron is set up and how to trigger a manual run

---

## Verification

1. Add three secrets to GitHub repo settings: `BALL_DONT_LIE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
2. Push — confirm workflow appears in the **Actions** tab
3. Trigger manually with `TEST_MODE=true` via **Run workflow** button
4. Check Supabase: new events created, bet rows exist for all users
5. `pytest worker/test_worker.py -v` passes locally
6. GitHub Actions log shows clean grouped output — no per-row noise
