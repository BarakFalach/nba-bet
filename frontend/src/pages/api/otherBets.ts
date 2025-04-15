import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { betId } = req.query;
  
  if (!betId) {
    return res.status(400).json({ error: 'Bet ID is required' });
  }

  try {
    // Get the event ID associated with this bet
    const { data: betData, error: betError } = await supabase
      .from('bets')
      .select('eventId')
      .eq('id', betId)
      .single();

    if (betError || !betData) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    // Get all bets for this event with user IDs
    const { data: otherBets, error: otherBetsError } = await supabase
      .from('bets')
      .select(`
        winnerTeam, 
        winMargin,
        userId
      `)
      .eq('eventId', betData.eventId)
      .not('winnerTeam', 'is', null);

    if (otherBetsError) {
      console.error('Error fetching other bets:', otherBetsError);
      return res.status(500).json({ error: 'Error fetching other bets' });
    }

    // Get all users data in a separate query, matching leaderBoard.ts approach
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('uuid, email, name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Error fetching user data' });
    }

    // Create a users map for quick lookups
    const usersMap = new Map();
    usersData?.forEach(user => {
      usersMap.set(user.uuid, {
        email: user.email,
        name: user.name || user.email?.split('@')[0] || 'Anonymous'
      });
    });

    // Format the response
    const formattedBets = otherBets.map(bet => {
      const userData = usersMap.get(bet.userId) || { email: '', name: 'Anonymous' };
      
      return {
        userId: bet.userId,
        name: userData.name,
        winnerTeam: bet.winnerTeam,
        winMargin: bet.winMargin
      };
    });

    return res.status(200).json(formattedBets);
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}