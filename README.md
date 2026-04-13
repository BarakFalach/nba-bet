# NBA Bet

A playoff betting app where users predict game and series outcomes and earn points based on accuracy.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (Node 18.16.0) |
| Database | Supabase (Postgres) |
| Worker | Python 3.10+ |
| CI / Automation | GitHub Actions |

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Worker

The worker syncs live playoff data from the BallDontLie API into Supabase and scores user bets automatically. It runs on a GitHub Actions cron schedule every 15 minutes during playoff hours.

See [`worker/README.md`](worker/README.md) for full setup, environment variables, and local run instructions.

```bash
cd worker
pip install -r requirements.txt
python run.py
```

---

## GitHub Actions

The sync workflow (`.github/workflows/sync.yml`) requires three repository secrets:

| Secret | Description |
|--------|-------------|
| `BALL_DONT_LIE_API_KEY` | BallDontLie API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
