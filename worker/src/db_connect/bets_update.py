import json 

def upsert(supabase_client, event_data, table_name):
    return supabase_client.table(table_name).upsert(event_data).execute()

def getBet(supabase_client, game_id, user_id):

    response = supabase_client.table('bets').select('*').eq('eventId', game_id).eq('userId', user_id).execute()
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

def getCalcFunc(round):
    if round == "1":
        return "f_round1"
    if round == "2":
        return "f_round2"
    if round == "3":
        return "f_round3"
    if round == "playin":
        return "f_playin"
    
    return "f0"


## Points gain calculation Functions based on round ##

# default
def f0(is_bet_winner):
    return 0

# round 1
def f_round1(is_bet_winner):
    if is_bet_winner:
        return 6
    return 0

# round 2
def f_round2(is_bet_winner):
    if is_bet_winner:
        return 8
    return 0

# round 3
def f_round3(is_bet_winner):
    if is_bet_winner:
        return 10
    return 0

# round playin
def f_playin(is_bet_winner):
    if is_bet_winner:
        return 10
    return 0

## Points gain calculation Functions based on Win Margin ##

def isClosestWinner(supabase_client, gid, uid):
    # get all bets for this game
    response = supabase_client.table('bets').select('*').eq('eventId', gid).execute()
    all_bets = json.loads(response.json())['data']

    # get the bet for this user
    bet = getBet(supabase_client, gid, uid)

    my_wm = bet["winMargin"]
    if my_wm == None or my_wm < 0:
        return 0

    wms = []
    for b in all_bets:
        wms.append(abs(b["winMargin"] - my_wm))

    if min(wms) == my_wm:
        return 3
    
    return 0


def updateBetsTable(supabase_client, game_data):

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
        calc_func = getCalcFunc(game_data["round"])

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

            new_bet = upsert(supabase_client, bet_data, 'bets')
            bet = json.loads(new_bet.json())['data'][0]

        print(f"game -> {game_data.get("id")}   |||   round  -> {game_data["round"]}   |||   uid -> {uid[0:12]}...   |||   bet -> {bet["id"]}")

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


            pointsGainedWinMargin = isClosestWinner(supabase_client, gid, uid)
            pointsGained = trigger_function(calc_func, is_bet_winner)
            
        else:
            # print("game data -> ", game_data["id"])
            result = None
            winMargin = None
            is_bet_winner = None
            pointsGained = None
            pointsGainedWinMargin = None

            if False:
                print("game -> ", game_data)
                print("\n----------------------\n")
                print("bet -> ", bet)
                print("result -> ", result)
                print("winMargin -> ", winMargin)
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
                # "winMargin": winMargin,
                "pointsGained": pointsGained,
                "pointsGainedWinMargin": pointsGainedWinMargin,
                "calcFunc": calc_func
            }
        
        # print("bet_data  -> ", bet_data)
        
        response = upsert(supabase_client, bet_data, 'bets')
        # if game_data["status"] == 1:
        #     print("updating bet -> ", response)

    # if it does not exist
    # create for each user and set the game, result and winMargin






    # for user in uids:
    #     gid = game_data["id"]
    #     uid = user['id']
        
    #     result = game_data["team1"] if game_data["team1Score"] > game_data["team2Score"] else game_data["team2"]
    #     winMargin = abs(game_data["team1Score"] - game_data["team2Score"])

    #     if isBetExist(supabase_client, gid, uid, all_bets):

            
    #         is_bet_winner = True if game_data["team1"] == result else False
    #         # print("updating")
    #         bet_data = {
    #             "eventId": gid,
    #             "userId": int(uid),
    #             "eventType": game_data["eventType"],
    #             "closeTime": game_data["startTime"],
    #             "result": result,
    #             "winMargin": winMargin
    #         }
    #         response = upsert(supabase_client, bet_data, 'bets')
        
    #     # if bet not exist then create on for each user in UserList
    #     if not isBetExist(supabase_client, gid, uid, all_bets):
    #         # print("adding new")
    #         bet_data = {
    #             "eventId": gid,
    #             "userId": int(uid),
    #             "eventType": game_data["eventType"],
    #             "closeTime": game_data["startTime"]
    #         }
    #         response = upsert(supabase_client, bet_data, 'bets')

    return {
        'statusCode': 200,
        'body': ":)"
    }
