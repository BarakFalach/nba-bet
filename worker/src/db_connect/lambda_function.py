import os
import supabase
from .scoreboard import getTodaysGames
from datetime import datetime


supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_ANON_KEY')
supabase_client = supabase.create_client(supabase_url, supabase_key)

def lambda_handler(event, context):
    response = supabase_client.table('events').select('*').execute()

    # Example usage
    todays_games = getTodaysGames()
    for game_data in todays_games:
        print(game_data)
        response = supabase_client.table('events').upsert(game_data).execute()
        if response.status_code == 201:
            print("Data upserted successfully!")
        else:
            print(f"Failed to upsert data: {response.json()}")

        print("\n\n")


    return {
        'statusCode': 200,
        'body': ":)"
    }
