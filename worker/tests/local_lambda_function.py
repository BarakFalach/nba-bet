from nba_api_interface import getTodaysGames, getGameInfoByGameId
from supabase_interface import getEventIdsWhereNullScoreExists, upsert, updateBets

def lambda_handler(event, context):
    
    # get today's games
    todays_games = getTodaysGames()
    for game_data in todays_games:
        
        # Insert or update event data
        upsert(game_data)

        # Insert or update bets data per user
        updateBets(game_data)

    # update all events with data - for games
    event_ids_with_null = getEventIdsWhereNullScoreExists("game")
    print(event_ids_with_null)
    for event_id in event_ids_with_null:
        event_data = getGameInfoByGameId(event_id)
        if event_data != {} and event_data['status'] == 3:
            print(event_data)
            upsert(event_data)

    return {
        'statusCode': 200,
        'body': ":)"
    }
