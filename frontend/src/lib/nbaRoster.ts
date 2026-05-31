import { getNbaStatsTeamId } from '@/lib/teamConferences';

export interface NbaRosterPlayer {
  playerId: number;
  playerName: string;
}

const ROSTER_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const rosterCache = new Map<string, { expiresAt: number; players: NbaRosterPlayer[] }>();

function toNbaSeasonString(season: number): string {
  return `${season - 1}-${String(season).slice(-2)}`;
}

function cacheKey(teamName: string, season: number): string {
  return `${teamName}:${season}`;
}

async function fetchRosterFromStatsApi(
  teamName: string,
  season: number,
): Promise<NbaRosterPlayer[]> {
  const teamId = getNbaStatsTeamId(teamName);
  if (!teamId) {
    throw new Error(`Unknown team: ${teamName}`);
  }

  const url = new URL('https://stats.nba.com/stats/commonteamroster');
  url.searchParams.set('TeamID', String(teamId));
  url.searchParams.set('Season', toNbaSeasonString(season));

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'x-nba-stats-origin': 'stats',
      'x-nba-stats-token': 'true',
      Referer: 'https://www.nba.com/',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`NBA roster API returned ${response.status}`);
  }

  const data = await response.json();
  const resultSet = data.resultSets?.[0];
  if (!resultSet?.headers || !resultSet?.rowSet) return [];

  const playerNameIndex = resultSet.headers.indexOf('PLAYER');
  const playerIdIndex = resultSet.headers.indexOf('PLAYER_ID');
  if (playerNameIndex === -1 || playerIdIndex === -1) return [];

  return (resultSet.rowSet as unknown[][])
    .map((row) => ({
      playerId: Number(row[playerIdIndex]),
      playerName: String(row[playerNameIndex]),
    }))
    .filter((player) => player.playerId && player.playerName)
    .sort((a, b) => a.playerName.localeCompare(b.playerName));
}

export async function getTeamRoster(
  teamName: string,
  season: number,
): Promise<NbaRosterPlayer[]> {
  const key = cacheKey(teamName, season);
  const cached = rosterCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.players;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const players = await fetchRosterFromStatsApi(teamName, season);
      if (players.length > 0) {
        rosterCache.set(key, {
          players,
          expiresAt: Date.now() + ROSTER_CACHE_TTL_MS,
        });
      }
      return players;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch team roster');
}
