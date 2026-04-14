# NBA Bet Worker

The worker is a Python script that keeps the app's Supabase database in sync with live NBA playoff data from the [BallDontLie API](https://www.balldontlie.io). It runs automatically via a GitHub Actions cron job, or can be triggered manually.

---

## What it does

The worker runs a 6-step pipeline on every execution:

| Step | Description |
|------|-------------|
| 1 | Fetch all playoff + play-in games from BallDontLie (from April 14 onwards) |
| 2 | Load existing events and bet coverage from Supabase |
| 3 | **Create** game-level events for new games; **update** scores and status as games progress and finish |
| 4 | **Create** series-level events for new matchups (not play-in); **update** win counts and series status |
| 5 | **Create bet rows** for each user on newly added events, per the betting structure below |
| 6 | **Score bets** on events that resolved in this run — writes `pointsGained` and `pointsGainedWinMargin` |

### Betting structure per round

| Round | Bet on games | Bet on series |
|-------|:------------:|:-------------:|
| Play-in | ✓ | — |
| First Round | — | ✓ |
| Second Round | — | ✓ |
| Conference Finals | ✓ | ✓ |
| Finals | ✓ | ✓ |

---

## Running locally

### 1. Set up environment

```bash
cd worker
cp .env.example .env   # then fill in your values
pip install -r requirements.txt
```

`.env` variables:

| Variable | Purpose |
|----------|---------|
| `BALL_DONT_LIE_API_KEY` | BallDontLie API key — [balldontlie.io](https://www.balldontlie.io) |
| `SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `SUPABASE_ANON_KEY` | Supabase anon/public key (Project Settings → API) |
| `EVENTS_ONLY` | Set to `true` to create events without creating or scoring bets |
| `TARGET_USER_IDS` | Comma-separated user UUIDs to restrict bet creation to. Leave empty to create bets for all users. |

### 2. Run the sync

```bash
python run.py
```

### 3. Run tests

```bash
pytest test_worker.py -v
```

---

## Modes

### `EVENTS_ONLY=true`

Creates and updates events in Supabase but skips bet creation and scoring entirely. Useful for inspecting what events would be created before publishing bets to users.

### `TARGET_USER_IDS`

Restricts bet creation to specific users. Useful for verifying the full pipeline (events + bets + scoring) for a single user before rolling out to everyone.

```bash
# Create bets only for two test users
TARGET_USER_IDS=uuid-1,uuid-2 python run.py
```

---

## GitHub Actions

The workflow is defined in `.github/workflows/sync.yml`. It runs automatically:

- **Every 15 minutes** from 5 pm to 5 am UTC (1 pm–1 am ET) during April, May, and June

### Manual trigger

1. Go to the **Actions** tab in GitHub
2. Select **NBA Bet Sync**
3. Click **Run workflow**

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
