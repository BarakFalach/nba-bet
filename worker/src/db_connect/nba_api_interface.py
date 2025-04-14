# Query nba.live.endpoints.scoreboard and  list games in localTimeZone
from datetime import datetime, timezone
from dateutil import parser
from nba_api.live.nba.endpoints import scoreboard
from nba_api.live.nba.endpoints import boxscore
from nba_api.stats.endpoints import playoffpicture
import hashlib

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
            high_seed_team = series[2]
            low_seed_team = series[5]
            team_1_score = series[7]
            team_2_score = series[8]

            generatedID = generate_id(high_seed_team, low_seed_team)

            event_data = {
                "id": generatedID,
                "team1": high_seed_team,
                "team2": low_seed_team,
                "eventType": "series",
                # "team1Score": team_1_score,
                # "team2Score": team_2_score
            }

            print("event_data -> ", event_data)
            series_data.append(event_data)

    return series_data