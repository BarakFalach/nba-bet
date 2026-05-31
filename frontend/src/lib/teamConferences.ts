import { nbaTeams } from '../types/events';

export type Conference = 'East' | 'West';

export const nbaTeamConferences: Record<keyof typeof nbaTeams, Conference> = {
  Hawks: 'East',
  Celtics: 'East',
  Nets: 'East',
  Hornets: 'East',
  Bulls: 'East',
  Cavaliers: 'East',
  Pistons: 'East',
  Pacers: 'East',
  Heat: 'East',
  Bucks: 'East',
  Knicks: 'East',
  Magic: 'East',
  Sixers: 'East',
  Raptors: 'East',
  Wizards: 'East',
  Mavericks: 'West',
  Nuggets: 'West',
  Warriors: 'West',
  Rockets: 'West',
  Clippers: 'West',
  Lakers: 'West',
  Grizzlies: 'West',
  Timberwolves: 'West',
  Pelicans: 'West',
  Thunder: 'West',
  Suns: 'West',
  TrailBlazers: 'West',
  Kings: 'West',
  Spurs: 'West',
  Jazz: 'West',
};

export const nbaTeamAbbr: Record<keyof typeof nbaTeams, string> = {
  Hawks: 'ATL',
  Celtics: 'BOS',
  Nets: 'BKN',
  Hornets: 'CHA',
  Bulls: 'CHI',
  Cavaliers: 'CLE',
  Mavericks: 'DAL',
  Nuggets: 'DEN',
  Pistons: 'DET',
  Warriors: 'GSW',
  Rockets: 'HOU',
  Pacers: 'IND',
  Clippers: 'LAC',
  Lakers: 'LAL',
  Grizzlies: 'MEM',
  Heat: 'MIA',
  Bucks: 'MIL',
  Timberwolves: 'MIN',
  Pelicans: 'NOP',
  Knicks: 'NYK',
  Thunder: 'OKC',
  Magic: 'ORL',
  Sixers: 'PHI',
  Suns: 'PHX',
  TrailBlazers: 'POR',
  Kings: 'SAC',
  Spurs: 'SAS',
  Raptors: 'TOR',
  Jazz: 'UTA',
  Wizards: 'WAS',
};

function normalizeTeamKey(team: string): keyof typeof nbaTeams | null {
  if (!team) return null;
  const normalized = team.replace(/\s+/g, '');
  const key = normalized === '76ers' ? 'Sixers' : normalized;
  if (key in nbaTeamConferences) return key as keyof typeof nbaTeams;
  return null;
}

export function getConference(team: string): Conference | null {
  const key = normalizeTeamKey(team);
  return key ? nbaTeamConferences[key] : null;
}

export function getTeamAbbr(team: string): string {
  const key = normalizeTeamKey(team);
  if (key) return nbaTeamAbbr[key];
  return team ? team.slice(0, 3).toUpperCase() : 'TBD';
}

export const nbaStatsTeamIds: Record<keyof typeof nbaTeams, number> = {
  Hawks: 1610612737,
  Celtics: 1610612738,
  Nets: 1610612751,
  Hornets: 1610612766,
  Bulls: 1610612741,
  Cavaliers: 1610612739,
  Mavericks: 1610612742,
  Nuggets: 1610612743,
  Pistons: 1610612765,
  Warriors: 1610612744,
  Rockets: 1610612745,
  Pacers: 1610612754,
  Clippers: 1610612746,
  Lakers: 1610612747,
  Grizzlies: 1610612763,
  Heat: 1610612748,
  Bucks: 1610612749,
  Timberwolves: 1610612750,
  Pelicans: 1610612740,
  Knicks: 1610612752,
  Thunder: 1610612760,
  Magic: 1610612753,
  Sixers: 1610612755,
  Suns: 1610612756,
  TrailBlazers: 1610612757,
  Kings: 1610612758,
  Spurs: 1610612759,
  Raptors: 1610612761,
  Jazz: 1610612762,
  Wizards: 1610612764,
};

export function getNbaStatsTeamId(team: string): number | null {
  const key = normalizeTeamKey(team);
  return key ? nbaStatsTeamIds[key] : null;
}
