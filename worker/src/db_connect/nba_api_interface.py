# Query nba.live.endpoints.scoreboard and  list games in localTimeZone
from datetime import datetime, timezone
from dateutil import parser
from nba_api.live.nba.endpoints import scoreboard
from nba_api.live.nba.endpoints import boxscore

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
