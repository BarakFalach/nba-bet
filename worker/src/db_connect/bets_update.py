import json 
from supabase_interface import supabase_upsert, getSupabaseClient

bets_table_name = 'bets'

def getBet(supabase_client, game_id, user_id):

    response = supabase_client.table(bets_table_name).select('*').eq('eventId', game_id).eq('userId', user_id).execute()
    try:
        bet = json.loads(response.json())['data'][0]
        return bet
    except Exception as e:
        return {}

def trigger_function(func_name, *args, **kwargs):
    if func_name in globals() and callable(globals()[func_name]):
        return globals()[func_name](*args, **kwargs)
    else:
        return f"Function '{func_name}' not found."

def getCalcFunc(round, type=""):
    if round == "firstRound":
        return "f_firstRound"
    
    if round == "secondRound":
        return "f_secondRound"
    
    if round == "conference":
        if type == "game":
            return "f_conference_game"
        if type == "series":
            return "f_conference_series"
        
    if round == "finals":
        if type == "game":
            return "f_finals_game"
        if type == "series":
            return "f_finals_series"
        

    if round == "playin":
        return "f_playin"
    
    return "f0"


## Points gain calculation Functions based on round ##

# default
def f0(is_bet_winner):
    return 0

# round playin
def f_playin(is_bet_winner):
    if is_bet_winner:
        return 2
    return 0

# First Round
def f_firstRound(is_bet_winner):
    if is_bet_winner:
        return 4
    return 0

# Second Round
def f_secondRound(is_bet_winner):
    if is_bet_winner:
        return 8
    return 0

# Conference Round
def f_conference_series(is_bet_winner):
    if is_bet_winner:
        return 8
    return 0

# Conference Round
def f_conference_game(is_bet_winner):
    if is_bet_winner:
        return 2
    return 0

# Finals
def f_finals_series(is_bet_winner):
    if is_bet_winner:
        return 12
    return 0

# Finals
def f_finals_game(is_bet_winner):
    if is_bet_winner:
        return 4
    return 0


## Points gain calculation Functions based on Win Margin ##
# This function also wraps the closest winner function for series (WinMargin also acts series bet wager)

def isClosestWinner(supabase_client, gid, uid, winMargin, result, playoff_round, event_type):
    # get all bets for this game
    response = supabase_client.table(bets_table_name).select('*').eq('eventId', gid).execute()
    all_bets = json.loads(response.json())['data']

    # get the win margin for this user
    bet = getBet(supabase_client, gid, uid)
    my_wm = bet["winMargin"]

    if my_wm == None or my_wm < 0:
        return 0
    
    if event_type == "series":
        return isClosestWinnerSeries(supabase_client, gid, uid, winMargin, result, playoff_round, event_type)

    # else not a series then GAME

    # if exact winMargin
    if winMargin - my_wm == 0:
        if playoff_round == "playin":
            return 2
        if playoff_round == "conference":
            return 2
        if playoff_round == "finals":
            return 4

    # if not exact winMargin
    # get all the winMargins for this game
    # and check if my winMargin is the closest

    # if in first or second round then not being exact is zero points
    if playoff_round == "firstRound" or playoff_round == "secondRound":
        return 0

    wms = []
    for b in all_bets:
        # if placed a winMargin and guessed correctly
        if b["winMargin"] != None and result == b["winnerTeam"]:
            wms.append(abs(winMargin - b["winMargin"]))


    my_delta = abs(my_wm - winMargin)
    # print("wms -> ", wms)
    # print("my_delta -> ", my_delta)
    # print("min(wms) -> ", min(wms))

    if min(wms) == my_delta:
        if playoff_round == "playin":
            return 1
        if playoff_round == "conference":
            return 1
        if playoff_round == "finals":
            return 2
    
    return 0


def isClosestWinnerSeries(supabase_client, gid, uid, seriesGameBet, result, playoff_round, event_type):
    # get all bets for this game
    response = supabase_client.table(bets_table_name).select('*').eq('eventId', gid).execute()
    all_bets = json.loads(response.json())['data']

    # get the win margin for this user
    bet = getBet(supabase_client, gid, uid)
    my_series_game_bet = bet["winMargin"]

    if my_series_game_bet == None or my_series_game_bet < 0:
        return 0

    # if exact winMargin
    if seriesGameBet - my_series_game_bet == 0:
        if playoff_round == "firstRound":
            return 2
        if playoff_round == "secondRound":
            return 4
        if playoff_round == "conference":
            return 4
        if playoff_round == "finals":
            return 4
    
    return 0


def updateBetsTable(game_data):

    # TESTING

    # if game_data['id'] == "3037336972":
    #     print("+++++++++++++++++++++++++++++++++")
    #     game_data['team1Score'] = 4
    #     game_data['team2Score'] = 2
    #     game_data['status'] = 3
    #     game_data["round"] = "finals"

    supabase_client = getSupabaseClient()

    response = supabase_client.table('users').select('uuid').execute()
    user_list=json.loads(response.json())
    uids = user_list["data"]

    # if it exists
    # go through each user and update the game, result and winMargin
    for user in uids:
        gid = game_data["id"]
        uid = user['uuid']


        # if bet doesnt exist then quickly create it
        bet = getBet(supabase_client, gid, uid)

        # calculate correct calculation function
        calc_func = getCalcFunc(game_data["round"], game_data["eventType"])

        if bet == {}:

            # games fresh from the api do no have a round
            if (game_data.get("round") == None):
                game_data["round"] = "0"

            bet_data = {
                "eventId": gid,
                "userId": uid,
                "eventType": game_data["eventType"],
                "closeTime": game_data["startTime"],
                "calcFunc": calc_func
            }

            new_bet = supabase_upsert(bet_data, bets_table_name)
            bet = json.loads(new_bet.json())['data'][0]

        # print(f"game -> {game_data.get("id")}   |||   round  -> {game_data["round"]}   |||   uid -> {uid[0:12]}...   |||   bet -> {bet["id"]}")

        # game is over and can calculate points
        if game_data["status"] == 3:

            # print("game is over -> ", game_data["id"])
            result = game_data["team1"] if game_data["team1Score"] > game_data["team2Score"] else game_data["team2"]
            # winMargin = abs(game_data["team1Score"] - game_data["team2Score"])

            # check if user wagered correctly
            if bet["winnerTeam"] == result:
                is_bet_winner = True 
            else: 
                is_bet_winner = False
                # winMargin = winMargin * -1  # wrong direction of winMargin


            gameWinMargin = abs(game_data.get("team1Score") - game_data.get("team2Score"))

            if game_data["eventType"] == "series":
                # if series then we want how many games were played total
                gameWinMargin = abs(game_data.get("team1Score") + game_data.get("team2Score"))

            playoff_round = game_data["round"]
            event_type = game_data["eventType"]
            pointsGainedWinMargin = isClosestWinner(supabase_client, gid, uid, gameWinMargin, result, playoff_round, event_type) if is_bet_winner else 0
            pointsGained = trigger_function(calc_func, is_bet_winner)
            
        else:
            # print("game data -> ", game_data["id"])
            result = None
            is_bet_winner = None
            pointsGained = None
            pointsGainedWinMargin = None

            if False:
                print("game -> ", game_data)
                print("\n----------------------\n")
                print("bet -> ", bet)
                print("result -> ", result)
                print("is_bet_winner -> ", is_bet_winner)
                print("calc_func -> ", calc_func)
                print("pointsGained -> ", pointsGained)
                print("\n\n\n")

        bet_data = {
                "id": bet["id"],
                "eventId": gid,
                "userId": uid,
                "eventType": game_data["eventType"],
                "closeTime": game_data["startTime"],
                "result": result,
                "pointsGained": pointsGained,
                "pointsGainedWinMargin": pointsGainedWinMargin,
                "calcFunc": calc_func
            }
        
        # print("bet_data  -> ", bet_data)
        
        response = supabase_upsert(bet_data, bets_table_name)
        # if game_data["status"] == 1:
        #     print("updating bet -> ", response)

    # if it does not exist
    # create for each user and set the game, result and winMargin


    return {
        'statusCode': 200,
        'body': ":)"
    }
