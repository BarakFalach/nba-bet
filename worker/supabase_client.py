from supabase import create_client, Client

from config import SUPABASE_URL, SUPABASE_ANON_KEY, APP_SEASON


def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def fetch_existing_events(supabase: Client) -> list[dict]:
    """Fetch all events for the current app season from Supabase."""
    response = supabase.table("events").select("*").eq("season", APP_SEASON).execute()
    return response.data or []


def insert_events(supabase: Client, events: list[dict]) -> list[dict]:
    """Insert new event rows into Supabase. Returns inserted rows."""
    if not events:
        return []
    response = supabase.table("events").insert(events).execute()
    return response.data or []


def update_event(supabase: Client, event_id: str, updates: dict) -> dict | None:
    """Update an existing event row in Supabase."""
    response = (
        supabase.table("events")
        .update(updates)
        .eq("id", event_id)
        .execute()
    )
    data = response.data
    return data[0] if data else None


def fetch_all_user_ids(supabase: Client) -> list[str]:
    """Return UUIDs of all active users (is_active = true)."""
    response = (
        supabase.table("users")
        .select("uuid")
        .eq("is_active", True)
        .execute()
    )
    return [row["uuid"] for row in (response.data or [])]


def fetch_existing_bet_pairs(supabase: Client) -> set[tuple[str, str]]:
    """Return the set of (eventId, userId) pairs that already have a bet row."""
    response = (
        supabase.table("bets")
        .select("eventId, userId, events!inner(season)")
        .eq("events.season", APP_SEASON)
        .execute()
    )
    return {(row["eventId"], str(row["userId"])) for row in (response.data or [])}


def fetch_unscored_resolved_event_ids(supabase: Client) -> list[str]:
    """Return event IDs that are resolved but still have unscored placed bets.

    Used to catch events that were already resolved when their bets were
    created — the normal transition-based scoring would never pick these up.
    """
    response = (
        supabase.table("bets")
        .select("eventId, events!inner(status, season)")
        .is_("pointsGained", "null")
        .not_.is_("winnerTeam", "null")
        .eq("events.status", 3)          # STATUS_RESOLVED
        .eq("events.season", APP_SEASON)
        .execute()
    )
    return list({row["eventId"] for row in (response.data or [])})


def fetch_event_bets(supabase: Client, event_id: str) -> list[dict]:
    """Fetch all bet rows for a specific event."""
    response = (
        supabase.table("bets")
        .select("*")
        .eq("eventId", event_id)
        .execute()
    )
    return response.data or []


def insert_bets(supabase: Client, bets: list[dict]) -> int:
    """Bulk insert bet rows. Returns the number of rows inserted."""
    if not bets:
        return 0
    response = supabase.table("bets").insert(bets).execute()
    return len(response.data or [])


def update_bets_points(supabase: Client, updates: list[tuple[str, dict]]) -> int:
    """Write pointsGained / pointsGainedWinMargin for each (bet_id, data) pair."""
    for bet_id, data in updates:
        supabase.table("bets").update(data).eq("id", bet_id).execute()
    return len(updates)
