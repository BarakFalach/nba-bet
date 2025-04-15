import sys
# caution: path[0] is reserved for script path (or '' in REPL)
sys.path.insert(1, '../src/db_connect')

from nba_api_interface import getTodaysGames, getGameInfoByGameId, getSeries
from supabase_interface import getEventIdsWhereNullScoreExists, upsert, updateBets, getEventsNotInBetsTable, getEventDataByEventId, getAllEvents

def lambda_handler(event, context):
    
    # get series data
    series = getSeries()
    for series_data in series:
        # Insert or update event data
        upsert(series_data, 'events')

        # Insert or update bets data per user
        # updateBets(series_data)

    # get today's games
    # todays_games = getTodaysGames()
    # for game_data in todays_games:
        
        # Insert or update event data
        # upsert(game_data, 'events')

        # Insert or update bets data per user
        # updateBets(game_data)

    # Insert Events not in Bets table - could be playins, series, etc...
    missing = getEventsNotInBetsTable()
    for event_id in missing:
        event_data = getEventDataByEventId(event_id)
        updateBets(event_data)

    # Update all events with data - for games
    has_null = getEventIdsWhereNullScoreExists("game")
    for event_id in has_null:
        event_data = getGameInfoByGameId(event_id)
        if event_data != {} and event_data['status'] == 3:      # game is over
            upsert(event_data, 'events')

    all_events = getAllEvents()
    for event in all_events:
        updateBets(event)

    return {
        'statusCode': 200,
        'body': ":)"
    }

if __name__ == "__main__":
    lambda_handler(None, None)