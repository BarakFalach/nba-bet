import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { getTeamRoster } from '@/lib/nbaRoster';

const LEGACY_SEASON = 2025;
const CURRENT_SEASON = 2026;

// Fallback deadline for legacy season (2025) — not used for 2026+
const LEGACY_MVP_DEADLINE = '2025-06-30T20:00:00Z';

const ROSTER_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

type MvpBetStatus = 'pending_finals' | 'open' | 'closed';

interface MvpBettingInfo {
  deadline: Date | null;
  isOpen: boolean;
  betStatus: MvpBetStatus;
}

interface FinalsTeams {
  team1: string;
  team2: string;
}

function isFinalsTeam(teamName: string, finalsTeams: FinalsTeams): boolean {
  return teamName === finalsTeams.team1 || teamName === finalsTeams.team2;
}

async function getMvpBettingInfo(season: number): Promise<MvpBettingInfo> {
  if (season === LEGACY_SEASON) {
    const deadline = new Date(LEGACY_MVP_DEADLINE);
    const isOpen = new Date() < deadline;
    return { deadline, isOpen, betStatus: isOpen ? 'open' : 'closed' };
  }
  const { data } = await supabase
    .from('events')
    .select('startTime')
    .eq('eventType', 'finalsMvp')
    .eq('season', season)
    .maybeSingle();
  if (!data?.startTime) {
    return { deadline: null, isOpen: false, betStatus: 'pending_finals' };
  }
  const deadline = new Date(data.startTime);
  const isOpen = new Date() < deadline;
  return { deadline, isOpen, betStatus: isOpen ? 'open' : 'closed' };
}

async function getFinalsTeams(season: number): Promise<FinalsTeams | null> {
  let query = supabase
    .from('events')
    .select('team1, team2')
    .eq('eventType', 'finalsMvp')
    .eq('round', 'finals');

  const dbSeason = season === LEGACY_SEASON ? null : season;
  if (dbSeason === null) {
    query = query.is('season', null);
  } else {
    query = query.eq('season', dbSeason);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data?.team1 || !data?.team2) return null;
  return { team1: data.team1, team2: data.team2 };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const seasonNum = req.body?.season
    ? Number(req.body.season)
    : req.query.season
      ? Number(req.query.season)
      : CURRENT_SEASON;
  const isLegacySeason = seasonNum === LEGACY_SEASON;
  const dbSeason = isLegacySeason ? null : seasonNum;

  // Handle POST request to create or update a finals MVP bet
  if (req.method === 'POST') {
    const { userId, playerId, playerName } = req.body;

    if (!userId || !playerId || !playerName) {
      return res.status(400).json({
        message: 'Missing required fields: userId, playerId, and playerName',
      });
    }

    const { deadline, isOpen } = await getMvpBettingInfo(seasonNum);
    if (!isOpen) {
      if (deadline === null) {
        return res.status(403).json({
          message: 'Betting not open yet',
          details: 'The Finals matchup has not been determined yet.',
        });
      }
      return res.status(403).json({
        message: 'Betting is closed',
        details: 'The deadline for placing Finals MVP bets has passed.',
      });
    }

    try {
      const finalsTeams = await getFinalsTeams(seasonNum);
      if (!finalsTeams) {
        return res.status(403).json({
          message: 'Betting not open yet',
          details: 'The Finals matchup has not been determined yet.',
        });
      }

      const [team1Roster, team2Roster] = await Promise.all([
        getTeamRoster(finalsTeams.team1, seasonNum),
        getTeamRoster(finalsTeams.team2, seasonNum),
      ]);
      const allowedPlayers = [...team1Roster, ...team2Roster];
      const matchedPlayer = allowedPlayers.find((p) => p.playerId === Number(playerId));

      if (!matchedPlayer || matchedPlayer.playerName !== playerName) {
        return res.status(400).json({
          message: 'Invalid player selection',
          details: 'The selected player is not on either Finals team roster.',
        });
      }

      let existingQuery = supabase
        .from('finals_mvp_bet')
        .select('*')
        .eq('userId', userId);

      if (isLegacySeason) {
        existingQuery = existingQuery.is('season', null);
      } else {
        existingQuery = existingQuery.eq('season', seasonNum);
      }

      const { data: existingBet, error: fetchError } = await existingQuery.single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      let result;

      if (existingBet) {
        const { data, error: updateError } = await supabase
          .from('finals_mvp_bet')
          .update({
            playerId: matchedPlayer.playerId,
            playerName: matchedPlayer.playerName,
            created_at: new Date().toISOString(),
          })
          .eq('id', existingBet.id)
          .select()
          .single();
        if (updateError) throw updateError;
        result = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('finals_mvp_bet')
          .insert({
            userId,
            playerId: matchedPlayer.playerId,
            playerName: matchedPlayer.playerName,
            season: dbSeason,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (insertError) throw insertError;
        result = data;
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error placing finals MVP bet:', error);
      return res.status(500).json({ message: 'Failed to place finals MVP bet' });
    }
  }

  // Handle GET request
  if (req.method === 'GET') {
    const { userId, teamName } = req.query;

    try {
      const finalsTeams = await getFinalsTeams(seasonNum);

      // Roster lookup for a specific Finals team
      if (teamName && typeof teamName === 'string') {
        if (!finalsTeams || !isFinalsTeam(teamName, finalsTeams)) {
          return res.status(400).json({
            message: 'Invalid team',
            details: 'Team is not one of the Finals participants.',
          });
        }

        try {
          const players = await getTeamRoster(teamName, seasonNum);
          if (players.length === 0) {
            return res.status(503).json({
              message: 'Roster unavailable',
              details: 'Finals rosters have not been synced yet. The worker will populate them once the Finals matchup is set.',
            });
          }
          res.setHeader('Cache-Control', ROSTER_CACHE_CONTROL);
          return res.status(200).json({ players });
        } catch (apiError) {
          console.error('Error fetching team roster:', apiError);
          return res.status(500).json({
            message: 'Failed to retrieve team roster',
            details: apiError instanceof Error ? apiError.message : 'Error connecting to player database',
          });
        }
      }

      // User bet lookup
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ message: 'Missing userId parameter' });
      }

      const { isOpen, betStatus } = await getMvpBettingInfo(seasonNum);

      let query = supabase
        .from('finals_mvp_bet')
        .select('*')
        .eq('userId', userId);

      if (isLegacySeason) {
        query = query.is('season', null);
      } else {
        query = query.eq('season', seasonNum);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return res.status(200).json({
        bet: data || null,
        isOpen,
        betStatus,
        finalsTeams,
      });
    } catch (error) {
      console.error('Error fetching finals MVP bet:', error);
      return res.status(500).json({ message: 'Failed to fetch finals MVP bet' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
