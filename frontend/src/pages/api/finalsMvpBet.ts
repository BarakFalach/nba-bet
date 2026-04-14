import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import NBA from 'nba';
import axios from 'axios';

const LEGACY_SEASON = 2025;
const CURRENT_SEASON = 2026;

// Fallback deadline for legacy season (2025) — not used for 2026+
const LEGACY_MVP_DEADLINE = '2025-06-30T20:00:00Z';

type MvpBetStatus = 'pending_finals' | 'open' | 'closed';

interface MvpBettingInfo {
  deadline: Date | null;
  isOpen: boolean;
  betStatus: MvpBetStatus;
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
    // finalsMvp event not yet created — Finals matchup not determined yet
    return { deadline: null, isOpen: false, betStatus: 'pending_finals' };
  }
  const deadline = new Date(data.startTime);
  const isOpen = new Date() < deadline;
  return { deadline, isOpen, betStatus: isOpen ? 'open' : 'closed' };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle POST request to create or update a finals MVP bet
  if (req.method === 'POST') {
    const { userId, playerName, season } = req.body;
    const seasonNum = season ? Number(season) : CURRENT_SEASON;
    const isLegacySeason = seasonNum === LEGACY_SEASON;
    const dbSeason = isLegacySeason ? null : seasonNum;

    if (!userId || !playerName) {
      return res.status(400).json({ message: 'Missing required fields: userId and playerName' });
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
      const apiKey = process.env.BALL_DONT_LIE_API_KEY;
      try {
        const response = await axios.get('https://api.balldontlie.io/v1/players', {
          params: { search: playerName },
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (response.data.data && response.data.data.length > 0) {
          const player = response.data.data[0];
          const fullPlayerName = `${player.first_name} ${player.last_name}`;
          const NBA_player = await NBA.findPlayer(fullPlayerName);

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
                playerId: NBA_player.playerId,
                playerName: fullPlayerName,
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
                playerId: NBA_player.playerId,
                playerName: fullPlayerName,
                season: dbSeason,
                created_at: new Date().toISOString(),
              })
              .select()
              .single();
            if (insertError) throw insertError;
            result = data;
          }

          return res.status(200).json(result);
        } else {
          return res.status(404).json({
            message: 'Player not found',
            details: `Could not find a player matching the name "${playerName}"`,
          });
        }
      } catch (apiError) {
        console.error('Error fetching player from BallDontLie API:', apiError);
        return res.status(500).json({
          message: 'Failed to retrieve player information',
          details: 'Error connecting to player database',
        });
      }
    } catch (error) {
      console.error('Error placing finals MVP bet:', error);
      return res.status(500).json({ message: 'Failed to place finals MVP bet' });
    }
  }

  // Handle GET request to fetch a user's finals MVP bet
  if (req.method === 'GET') {
    const { userId, season } = req.query;
    const seasonNum = season ? Number(season) : CURRENT_SEASON;
    const isLegacySeason = seasonNum === LEGACY_SEASON;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId parameter' });
    }

    try {
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

      return res.status(200).json({ bet: data || null, isOpen, betStatus });
    } catch (error) {
      console.error('Error fetching finals MVP bet:', error);
      return res.status(500).json({ message: 'Failed to fetch finals MVP bet' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
