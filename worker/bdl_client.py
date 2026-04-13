import httpx

from config import BDL_BASE_URL, BDL_SEASON, BALL_DONT_LIE_API_KEY, ROUND_DATE_RANGES

# First day of the play-in — only games from this date onwards are fetched.
PLAYOFFS_START_DATE = ROUND_DATE_RANGES[0][1]  # "2026-04-14"


async def fetch_bdl_games(client: httpx.AsyncClient) -> list[dict]:
    """
    Fetch all play-in + playoff games from BallDontLie for the configured season.
    Uses a start_date filter instead of postseason=true so that play-in games
    (which BallDontLie may not tag as postseason) are included.
    Handles cursor-based pagination.
    """
    all_games: list[dict] = []
    cursor: int | None = None

    params: dict = {
        "seasons[]": BDL_SEASON,
        "per_page": 100,
        "start_date": PLAYOFFS_START_DATE,
    }

    while True:
        if cursor is not None:
            params["cursor"] = cursor

        response = await client.get(
            f"{BDL_BASE_URL}/games",
            params=params,
            headers={"Authorization": BALL_DONT_LIE_API_KEY},
        )
        response.raise_for_status()
        body = response.json()

        games = body.get("data", [])
        all_games.extend(games)

        meta = body.get("meta", {})
        next_cursor = meta.get("next_cursor")
        if next_cursor is None or len(games) == 0:
            break
        cursor = next_cursor

    return all_games
