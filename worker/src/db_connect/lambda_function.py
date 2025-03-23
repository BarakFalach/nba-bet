import os
import supabase
from .nba_api_interface import getTodaysGames
from .bets_update import updateBets


supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_ANON_KEY')
supabase_client = supabase.create_client(supabase_url, supabase_key)

def lambda_handler(event, context):
    # supabase_client.table('events').select('*').execute()

    todays_games = getTodaysGames()
    for game_data in todays_games:
        
        # Insert or update event data
        supabase_client.table('events').upsert(game_data).execute()

        # Insert or update bets data per user
        updateBets(supabase_client, game_data)


    return {
        'statusCode': 200,
        'body': ":)"
    }
