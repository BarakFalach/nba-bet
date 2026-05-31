import { supabase } from '@/lib/supabaseClient';

const LEGACY_SEASON = 2025;

export interface NbaRosterPlayer {
  playerId: number;
  playerName: string;
}

export async function getTeamRoster(teamName: string, season: number): Promise<NbaRosterPlayer[]> {
  let query = supabase
    .from('finals_roster')
    .select('playerId, playerName')
    .eq('team', teamName)
    .order('playerName');

  if (season === LEGACY_SEASON) {
    query = query.is('season', null);
  } else {
    query = query.eq('season', season);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    playerId: row.playerId,
    playerName: row.playerName,
  }));
}
