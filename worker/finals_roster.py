"""Fetch and sync Finals team rosters into Supabase."""

from __future__ import annotations

import httpx
from supabase import Client

from config import APP_SEASON

NBA_STATS_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true",
    "Referer": "https://www.nba.com/",
}

# App team name -> stats.nba.com TeamID
NBA_TEAM_IDS: dict[str, int] = {
    "Hawks": 1610612737,
    "Celtics": 1610612738,
    "Nets": 1610612751,
    "Hornets": 1610612766,
    "Bulls": 1610612741,
    "Cavaliers": 1610612739,
    "Mavericks": 1610612742,
    "Nuggets": 1610612743,
    "Pistons": 1610612765,
    "Warriors": 1610612744,
    "Rockets": 1610612745,
    "Pacers": 1610612754,
    "Clippers": 1610612746,
    "Lakers": 1610612747,
    "Grizzlies": 1610612763,
    "Heat": 1610612748,
    "Bucks": 1610612749,
    "Timberwolves": 1610612750,
    "Pelicans": 1610612740,
    "Knicks": 1610612752,
    "Thunder": 1610612760,
    "Magic": 1610612753,
    "Sixers": 1610612755,
    "Suns": 1610612756,
    "TrailBlazers": 1610612757,
    "Kings": 1610612758,
    "Spurs": 1610612759,
    "Raptors": 1610612761,
    "Jazz": 1610612762,
    "Wizards": 1610612764,
}


def to_nba_season_string(app_season: int) -> str:
    return f"{app_season - 1}-{str(app_season)[-2:]}"


def fetch_team_roster_from_nba(client: httpx.Client, team_name: str, app_season: int) -> list[dict]:
    """Fetch current roster for a team from stats.nba.com."""
    team_id = NBA_TEAM_IDS.get(team_name)
    if team_id is None:
        raise ValueError(f"Unknown team: {team_name}")

    response = client.get(
        "https://stats.nba.com/stats/commonteamroster",
        params={"TeamID": team_id, "Season": to_nba_season_string(app_season)},
        headers=NBA_STATS_HEADERS,
        timeout=15.0,
    )
    response.raise_for_status()

    body = response.json()
    result_set = (body.get("resultSets") or [{}])[0]
    headers = result_set.get("headers") or []
    rows = result_set.get("rowSet") or []

    try:
        player_name_index = headers.index("PLAYER")
        player_id_index = headers.index("PLAYER_ID")
    except ValueError as exc:
        raise ValueError("Unexpected NBA roster response format") from exc

    players: list[dict] = []
    for row in rows:
        player_id = row[player_id_index]
        player_name = row[player_name_index]
        if player_id and player_name:
            players.append({"playerId": int(player_id), "playerName": str(player_name)})

    players.sort(key=lambda player: player["playerName"])
    return players


def has_finals_roster(supabase: Client, team_name: str, app_season: int = APP_SEASON) -> bool:
    query = supabase.table("finals_roster").select("id").eq("team", team_name).limit(1)
    if app_season == 2025:
        query = query.is_("season", "null")
    else:
        query = query.eq("season", app_season)
    response = query.execute()
    return bool(response.data)


def replace_finals_roster(
    supabase: Client,
    team_name: str,
    players: list[dict],
    app_season: int = APP_SEASON,
) -> int:
    """Replace all roster rows for a team/season. Returns rows inserted."""
    delete_query = supabase.table("finals_roster").delete().eq("team", team_name)
    if app_season == 2025:
        delete_query = delete_query.is_("season", "null")
    else:
        delete_query = delete_query.eq("season", app_season)
    delete_query.execute()

    if not players:
        return 0

    db_season = None if app_season == 2025 else app_season
    rows = [
        {
            "season": db_season,
            "team": team_name,
            "playerId": player["playerId"],
            "playerName": player["playerName"],
        }
        for player in players
    ]
    response = supabase.table("finals_roster").insert(rows).execute()
    return len(response.data or [])


def sync_finals_rosters(
    supabase: Client,
    team1: str,
    team2: str,
    *,
    app_season: int = APP_SEASON,
    force: bool = False,
) -> dict[str, int]:
    """
    Sync rosters for both Finals teams into Supabase.

    By default only fetches when a team's roster is missing. Pass force=True to refresh.
    Returns {team_name: players_inserted}.
    """
    results: dict[str, int] = {}

    with httpx.Client() as client:
        for team_name in (team1, team2):
            if not force and has_finals_roster(supabase, team_name, app_season):
                results[team_name] = 0
                continue

            players = fetch_team_roster_from_nba(client, team_name, app_season)
            results[team_name] = replace_finals_roster(supabase, team_name, players, app_season)

    return results
