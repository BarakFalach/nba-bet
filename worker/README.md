# NBA Bet Worker

The worker is a Python script that keeps the app's Supabase database in sync with live NBA playoff data from the [BallDontLie API](https://www.balldontlie.io). It runs automatically via a GitHub Actions cron job, or can be triggered manually.

---

## What it does

The worker runs a 6-step pipeline on every execution:

| Step | Description |
|------|-------------|
| 1 | Fetch all playoff games for the season from BallDontLie |
| 2 | Load existing events and bet coverage from Supabase |
| 3 | **Create** game-level events for new games; **update** scores and status as games progress and finish |
| 4 | **Create** series-level events for new matchups; **update** win counts and series status |
| 5 | **Create bet rows** for every user on each newly added event |
| 6 | **Score bets** on events that resolved in this run — writes `pointsGained` and `pointsGainedWinMargin` |

---

## Running locally

### 1. Set up environment

```bash
cd worker
cp .env.example .env   # then fill in your values
pip install -r requirements.txt
```

`.env` variables:

| Variable | Purpose | Where to get it |
|----------|---------|-----------------|
| `BALL_DONT_LIE_API_KEY` | BallDontLie API key | [balldontlie.io](https://www.balldontlie.io) |
| `SUPABASE_URL` | Supabase project URL | Supabase dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase dashboard → Project Settings → API |
| `TEST_MODE` | Set to `true` for safe test runs | — |
| `EVENTS_ONLY` | Set to `true` to sync events only — skips bet creation and scoring | — |
| `TARGET_USER_IDS` | Comma-separated user IDs to restrict bet creation to. Defaults to `2`. Set to empty string to create bets for all users. | — |

### 2. Run the sync

```bash
# Full run (uses live playoff data)
python run.py

# Safe test run — fetches last 7 days of regular-season games instead of playoffs
TEST_MODE=true python run.py
```

### 3. Run tests

```bash
pytest test_worker.py -v
```

---

## TEST_MODE

When `TEST_MODE=true`, the worker fetches recent **regular-season** games instead of playoff data. This means:
- You can run and validate the full pipeline any time of year
- All games are assigned to `firstRound` (since regular-season games have no round)
- Safe to run against your real Supabase database — it just creates test events

---

## GitHub Actions

The workflow is defined in `.github/workflows/sync.yml`. It runs automatically:

- **Every 15 minutes** from 5 pm to 5 am UTC (1 pm–1 am ET) during April, May, and June

### Manual trigger

1. Go to the **Actions** tab in GitHub
2. Select **NBA Bet Sync**
3. Click **Run workflow**
4. Optionally check **TEST_MODE** for a safe run with regular-season data

### Required secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `BALL_DONT_LIE_API_KEY` | BallDontLie API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |

---

## File overview

| File | Purpose |
|------|---------|
| `run.py` | Entrypoint — called by GitHub Actions and local runs |
| `sync.py` | Main pipeline orchestration (all 6 steps) |
| `bdl_client.py` | BallDontLie API client with pagination |
| `supabase_client.py` | Supabase read/write helpers |
| `models.py` | Data mapping, round detection, and point calculation |
| `config.py` | Environment variables, season config, and scoring rules |
| `test_worker.py` | Unit tests |
