import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env file from the same directory as this script
load_dotenv(Path(__file__).resolve().parent / ".env")

# ---------------------------------------------------------------------------
# Environment variables
# ---------------------------------------------------------------------------
BALL_DONT_LIE_API_KEY = os.environ.get("BALL_DONT_LIE_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", ""))
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
EVENTS_ONLY = os.environ.get("EVENTS_ONLY", "false").lower() == "true"

# Comma-separated list of user IDs to restrict bet creation to.
# When set, bets are only created for these users — useful for verifying
# events and scoring before rolling out to all users.
# Leave unset (or empty) to create bets for everyone.
_target_raw = os.environ.get("TARGET_USER_IDS", "")
TARGET_USER_IDS: list[str] | None = (
    [u.strip() for u in _target_raw.split(",") if u.strip()]
    if _target_raw.strip()
    else None
)

# ---------------------------------------------------------------------------
# Season configuration
# ---------------------------------------------------------------------------
# BallDontLie uses the season start year (e.g. 2025 for the 2025-26 season).
# The app uses the season end year (e.g. 2026 for the 2025-26 season).
BDL_SEASON = 2025          # BallDontLie season parameter
APP_SEASON = 2026          # App / Supabase season value

BDL_BASE_URL = "https://api.balldontlie.io/v1"

# ---------------------------------------------------------------------------
# Round detection – configurable date ranges for the 2026 playoffs
# ---------------------------------------------------------------------------
# Each tuple is (round_name, start_date_inclusive, end_date_inclusive).
# Adjust these each season as the NBA announces exact dates.
ROUND_DATE_RANGES: list[tuple[str, str, str]] = [
    ("playin",      "2026-04-14", "2026-04-17"),
    ("firstRound",  "2026-04-18", "2026-05-04"),
    ("secondRound", "2026-05-05", "2026-05-19"),
    ("conference",  "2026-05-20", "2026-06-02"),
    ("finals",      "2026-06-03", "2026-06-22"),
]

# ---------------------------------------------------------------------------
# Event status codes (matching the frontend convention)
# ---------------------------------------------------------------------------
STATUS_UPCOMING = 1
STATUS_IN_PROGRESS = 2
STATUS_RESOLVED = 3

# ---------------------------------------------------------------------------
# Scoring rules — mirrors PredictionResultPerType in frontend/src/types/events.ts
# Points are awarded per round and bet type.
# ---------------------------------------------------------------------------
SCORING: dict[str, dict[str, int]] = {
    "playin": {
        "correctWinnerPoints": 2,
        "correctScoreDifferenceExact": 2,   # bonus on top of winner points → 2+2=4 total max
        "correctScoreDifferenceClosest": 1, # bonus on top of winner points → 2+1=3 total
    },
    "firstRound": {
        "correctWinnerSeries": 4,
        "correctWinnerExactGames": 6,
    },
    "secondRound": {
        "correctWinnerSeries": 8,
        "correctWinnerExactGames": 12,
    },
    "conference": {
        "correctWinnerSeries": 8,
        "correctWinnerExactGames": 12,
        "correctWinnerPoints": 2,
        "correctScoreDifferenceExact": 2,   # bonus → 2+2=4 total max
        "correctScoreDifferenceClosest": 1, # bonus → 2+1=3 total
    },
    "finals": {
        "correctWinnerSeries": 12,
        "correctWinnerExactGames": 16,
        "correctWinnerPoints": 4,
        "correctScoreDifferenceExact": 4,   # bonus → 4+4=8 total max
        "correctScoreDifferenceClosest": 2, # bonus → 4+2=6 total
    },
}
