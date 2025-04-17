import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request to fetch a user's finals bet
  if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId parameter' });
    }

    try {
      const { data, error } = await supabase
        .from('finals_bet')
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
      console.error('Error fetching finals bet:', error);
      return res.status(500).json({ message: 'Failed to fetch finals bet' });
    }
  }

  // Handle POST request to create or update a finals bet
  if (req.method === 'POST') {
    const { userId, teamName } = req.body;

    if (!userId || !teamName) {
      return res.status(400).json({ message: 'Missing required fields: userId and teamName' });
    }

    // Check if betting deadline has passed
    const isBettingDeadlineReached = () => {
      // Deadline: April 19, 2025 at 20:00:00 UTC
      const deadlineUTC = new Date('2025-04-19T20:00:00Z');
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
      // Check if the user already has a finals bet
      const { data: existingBet, error: fetchError } = await supabase
        .from('finals_bet')
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
          .from('finals_bet')
          .update({ finalsBet:teamName, created_at: new Date().toISOString() })
          .eq('id', existingBet.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        // Create new bet
        const { data, error: insertError } = await supabase
          .from('finals_bet')
          .insert({
            userId,
            finalsBet: teamName,
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