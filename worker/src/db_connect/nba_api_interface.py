# Query nba.live.endpoints.scoreboard and  list games in localTimeZone
from datetime import datetime, timezone
from dateutil import parser
from nba_api.live.nba.endpoints import scoreboard
from nba_api.live.nba.endpoints import boxscore
from nba_api.stats.endpoints import playoffpicture, teamdetails
import hashlib

def getTeamName(teamId):
    deets = teamdetails.TeamDetails(team_id=teamId)
    team_data = deets.get_dict()
    return team_data["resultSets"][0]["rowSet"][0][2]

def getGameInfoByGameId(gameId: str):
    try:
        box = boxscore.BoxScore(gameId)
    except Exception as e:	# any exception returns no info
        return {}


    allInfo = box.game.get_dict()
    homeInfo = allInfo["homeTeam"]
    awayInfo = allInfo["awayTeam"]

    game_data = {
        "id": gameId,
        "team1": homeInfo['teamName'],
        "team2": awayInfo['teamName'],
        "startTime": allInfo["gameTimeUTC"],
        "eventType": "game",
        "team1Score": homeInfo['score'],
        "team2Score": awayInfo['score'],
        "status": allInfo['gameStatus']
    }

    return game_data

def getTodaysGames():
    board = scoreboard.ScoreBoard()
    games = board.games.get_dict()
    todays_games = []

    for game in games:
        gameTimeLTZ = parser.parse(game["gameTimeUTC"]).replace(tzinfo=timezone.utc).astimezone(tz=None)
        game_data = {
            "id": game['gameId'],
            "team1": game['homeTeam']['teamName'],
            "team2": game['awayTeam']['teamName'],
            "startTime": gameTimeLTZ.strftime('%Y-%m-%d %H:%M:%S'),
            "eventType": "game",
            "status": 1,
            # Include optional fields if available
            # "round": "quarterfinal",
            # "parentEvent": "series456",
            # "team1Score": 0,
            # "team2Score": 0
        }
        todays_games.append(game_data)

    return todays_games

def getSeries():

    # This function generates a unique ID for the playoff series based on the team names.
    def generate_id(input1, input2):
        hash_input = f"{input1}{input2}".encode()
        hash_object = hashlib.sha256(hash_input)
        return "30" + str(int(hash_object.hexdigest(), 16))[:8]

    pp = playoffpicture.PlayoffPicture('00','22024')
    playoffs = pp.get_dict()

    east = next(
        result_set["rowSet"]
        for result_set in playoffs["resultSets"]
        if result_set["name"] == "EastConfPlayoffPicture"
    )
    
    west = next(
        result_set["rowSet"]
        for result_set in playoffs["resultSets"]
        if result_set["name"] == "WestConfPlayoffPicture"
    )

    series_data = []

    for conference in [east, west]:
        for series in conference:
            
            # get team names from team id
            high_seed_team_name = getTeamName(series[3])
            low_seed_team_name = getTeamName(series[6])

            # gather scores
            team_1_score = series[7]
            team_2_score = series[8]
            
            generatedID = generate_id(high_seed_team_name, low_seed_team_name)

            event_data = {
                "id": generatedID,
                "team1": high_seed_team_name,
                "team2": low_seed_team_name,
                "eventType": "series",
                # "team1Score": team_1_score,
                # "team2Score": team_2_score
            }

            print("event_data -> ", event_data)
            series_data.append(event_data)

    return series_data