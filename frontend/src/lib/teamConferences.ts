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
