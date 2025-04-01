import os
import supabase
from bets_update import updateBetsTable

supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_ANON_KEY')
supabase_client = supabase.create_client(supabase_url, supabase_key)

def upsert(event_data):
    supabase_client.table('events').upsert(event_data).execute()

def updateBets(game_data):
    updateBetsTable(supabase_client, game_data)

def getEventIdsWhereNullScoreExists(eventType: str):
    response = supabase_client.table('events') \
        .select("id") \
        .or_("team1Score.is.null,team2Score.is.null") \
        .eq("eventType", eventType) \
        .execute()
    
    event_ids = [row["id"] for row in response.data]
    return event_ids
