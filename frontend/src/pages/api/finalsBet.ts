import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

const LEGACY_SEASON = 2025;
const CURRENT_SEASON = 2026;

// Season-specific deadlines
const SEASON_DEADLINES: Record<number, string> = {
  2025: '2025-04-19T20:00:00Z',
  2026: '2026-04-18T20:00:00Z',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request to fetch a user's finals bet
  if (req.method === 'GET') {
    const { userId, season } = req.query;
    const seasonNum = season ? Number(season) : CURRENT_SEASON;
    const isLegacySeason = seasonNum === LEGACY_SEASON;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId parameter' });
    }

    try {
      let query = supabase
        .from('finals_bet')
        .select('*')
        .eq('userId', userId);
      
      // Filter by season (NULL in DB means 2025)
      if (isLegacySeason) {
        query = query.is('season', null);
      } else {
        query = query.eq('season', seasonNum);
      }

      const { data, error } = await query.single();

      if (error) {
        // If no bet found, this is not really an error
        if (error.code === 'PGRST116') {
          return res.status(200).json(null);
        }
        throw error;
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching finals bet:', error);
      return res.status(500).json({ message: 'Failed to fetch finals bet' });
    }
  }

  // Handle POST request to create or update a finals bet
  if (req.method === 'POST') {
    const { userId, teamName, season } = req.body;
    const seasonNum = season ? Number(season) : CURRENT_SEASON;
    const isLegacySeason = seasonNum === LEGACY_SEASON;
    // For DB storage: NULL for 2025, actual number for others
    const dbSeason = isLegacySeason ? null : seasonNum;

    if (!userId || !teamName) {
      return res.status(400).json({ message: 'Missing required fields: userId and teamName' });
    }

    // Check if betting deadline has passed for this season
    const isBettingDeadlineReached = () => {
      const deadline = SEASON_DEADLINES[seasonNum] || SEASON_DEADLINES[CURRENT_SEASON];
      const deadlineUTC = new Date(deadline);
      const currentTime = new Date();
      
      return currentTime >= deadlineUTC;
    };

    if (isBettingDeadlineReached()) {
      return res.status(403).json({ 
        message: 'Betting is closed',
        details: 'The deadline for placing finals bets has passed.'
      });
    }

    try {
      // Check if the user already has a finals bet for this season
      let existingQuery = supabase
        .from('finals_bet')
        .select('*')
        .eq('userId', userId);
      
      if (isLegacySeason) {
        existingQuery = existingQuery.is('season', null);
      } else {
        existingQuery = existingQuery.eq('season', seasonNum);
      }

      const { data: existingBet, error: fetchError } = await existingQuery.single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let result;

      if (existingBet) {
        // Update existing bet
        const { data, error: updateError } = await supabase
          .from('finals_bet')
          .update({ finalsBet: teamName, created_at: new Date().toISOString() })
          .eq('id', existingBet.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // Create new bet with season
        const { data, error: insertError } = await supabase
          .from('finals_bet')
          .insert({
            userId,
            finalsBet: teamName,
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
      console.error('Error placing finals bet:', error);
      return res.status(500).json({ message: 'Failed to place finals bet' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}