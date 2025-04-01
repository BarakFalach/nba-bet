import json 
def isBetExist(supabase_client, game_id, user_id, all_bets):

    for e in all_bets['data']:
        if e['eventId'] == game_id and e['userId'] == user_id:
            return True
    return False

def updateBetsTable(supabase_client, game_data):

    response = supabase_client.table('users').select('id').execute()
    user_list=json.loads(response.json())
    uids = user_list["data"]

    response = supabase_client.table('bets').select('*').execute()
    all_bets=json.loads(response.json())

    # if bet not exist then create on for each user in UserList
    for user in uids:
        gid = game_data["id"]
        uid = user['id']
        
        if not isBetExist(supabase_client, gid, uid, all_bets):
            print("adding new")
            bet_data = {
                "eventId": gid,
                "userId": int(uid),
                "eventType": game_data["eventType"],
                "closeTime": game_data["startTime"]
            }
            response = supabase_client.table('bets').upsert(bet_data).execute()
    

    return {
        'statusCode': 200,
        'body': ":)"
    }
