import os
import supabase
from bets_update import updateBetsTable

supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_ANON_KEY')
supabase_client = supabase.create_client(supabase_url, supabase_key)

def upsert(event_data, table_name):
    return supabase_client.table(table_name).upsert(event_data).execute()

def updateBets(event_data):
    updateBetsTable(supabase_client, event_data)

def getEventIdsWhereNullScoreExists(eventType: str):
    response = supabase_client.table('events') \
        .select("id") \
        .or_("team1Score.is.null,team2Score.is.null,status.neq.3") \
        .eq("eventType", eventType) \
        .execute()
    
    event_ids = [row["id"] for row in response.data]
    return event_ids

def getEventsNotInBetsTable():
    # Fetch all eventIds from the Bets table
    bets_response = supabase_client.table('bets').select('eventId').execute()
    bet_event_ids = set([bet['eventId'] for bet in bets_response.data])
    bet_event_ids = sorted(bet_event_ids)

    # print(bet_event_ids)

    # Fetch all eventIds from the Events table
    events_response = supabase_client.table('events').select('id').execute()
    event_event_ids = set([bet['id'] for bet in events_response.data])
    event_event_ids = sorted(event_event_ids)

    # print(event_event_ids)

    missing_ids = []

    for event in event_event_ids:
        if event not in bet_event_ids:
            missing_ids.append(event)

    return missing_ids

def getEventDataByEventId(event_id):
    response = supabase_client.table('events').select('*').eq('id', event_id).execute()
    return response.data[0]


def getAllEvents():
    response = supabase_client.table('events').select('*').execute()
    return response.data