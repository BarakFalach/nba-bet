import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import NBA from 'nba';
import axios from 'axios';

const LEGACY_SEASON = 2025;
const CURRENT_SEASON = 2026;

// Season-specific MVP deadlines
const SEASON_MVP_DEADLINES: Record<number, string> = {
  2025: '2025-06-30T20:00:00Z',
  2026: '2026-06-29T20:00:00Z',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle POST request to create or update a finals MVP bet
  if (req.method === 'POST') {
    const { userId, playerName, season } = req.body;
    const seasonNum = season ? Number(season) : CURRENT_SEASON;
    const isLegacySeason = seasonNum === LEGACY_SEASON;
    // For DB storage: NULL for 2025, actual number for others
    const dbSeason = isLegacySeason ? null : seasonNum;

    if (!userId || !playerName) {
      return res.status(400).json({ message: 'Missing required fields: userId and playerName' });
    }

    // Check if betting deadline has passed for this season
    const isBettingDeadlineReached = () => {
      const deadline = SEASON_MVP_DEADLINES[seasonNum] || SEASON_MVP_DEADLINES[CURRENT_SEASON];
      const deadlineUTC = new Date(deadline);
      const currentTime = new Date();
      
      return currentTime >= deadlineUTC;
    };

    if (isBettingDeadlineReached()) {
      return res.status(403).json({ 
        message: 'Betting is closed',
        details: 'The deadline for placing finals MVP bets has passed.'
      });
    }
    console.error('Placing finals MVP bet:', { userId, playerName, season: seasonNum });

    try {
      // Get playerId from balldontlie API
      const apiKey = process.env.BALL_DONT_LIE_API_KEY;
      try {
        const response = await axios.get('https://api.balldontlie.io/v1/players', {
          params: {
            search: playerName
          },
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });

        if (response.data.data && response.data.data.length > 0) {
          
          // Get the first matching player
          // playerId = response.data.data[0].id;
          
          // Store player details for reference
          const player = response.data.data[0];
          const fullPlayerName = `${player.first_name} ${player.last_name}`;
          const NBA_player = await NBA.findPlayer(fullPlayerName);

          
          // Check if the user already has a finals MVP bet for this season
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

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          let result;

          if (existingBet) {
            // Update existing bet
            const { data, error: updateError } = await supabase
              .from('finals_mvp_bet')
              .update({ 
                playerId: NBA_player.playerId, 
                playerName: fullPlayerName,
                created_at: new Date().toISOString() 
              })
              .eq('id', existingBet.id)
              .select()
              .single();

            if (updateError) throw updateError;
            result = data;
          } else {
            // Create new bet with season
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
            details: `Could not find a player matching the name "${playerName}"`
          });
        }
      } catch (apiError) {
        console.error('Error fetching player from BallDontLie API:', apiError);
        return res.status(500).json({ 
          message: 'Failed to retrieve player information',
          details: 'Error connecting to player database'
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
      let query = supabase
        .from('finals_mvp_bet')
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
      console.error('Error fetching finals MVP bet:', error);
      return res.status(500).json({ message: 'Failed to fetch finals MVP bet' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}