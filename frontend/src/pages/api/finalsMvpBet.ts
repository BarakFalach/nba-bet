import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import NBA from 'nba';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle POST request to create or update a finals MVP bet
  if (req.method === 'POST') {
    const { userId, playerName } = req.body;

    if (!userId || !playerName) {
      return res.status(400).json({ message: 'Missing required fields: userId and playerName' });
    }

    // Check if betting deadline has passed
    const isBettingDeadlineReached = () => {
      // Deadline: April 19, 2025 at 20:00:00 UTC
      const deadlineUTC = new Date('2025-06-30T20:00:00Z');
      const currentTime = new Date();
      
      return currentTime >= deadlineUTC;
    };

    if (isBettingDeadlineReached()) {
      return res.status(403).json({ 
        message: 'Betting is closed',
        details: 'The deadline for placing finals MVP bets has passed.'
      });
    }
    console.error('Placing finals MVP bet:', { userId, playerName });

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

          
          // Check if the user already has a finals MVP bet
          const { data: existingBet, error: fetchError } = await supabase
            .from('finals_mvp_bet')
            .select('*')
            .eq('userId', userId)
            .single();

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
            // Create new bet
            const { data, error: insertError } = await supabase
              .from('finals_mvp_bet')
              .insert({
                userId,
                playerId: NBA_player.playerId, 
                playerName: fullPlayerName,
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
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId parameter' });
    }

    try {
      const { data, error } = await supabase
        .from('finals_mvp_bet')
        .select('*')
        .eq('userId', userId)
        .single();

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