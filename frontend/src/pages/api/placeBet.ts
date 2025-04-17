import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

interface Betting {
  winnerTeam: string;
  winMargin: number;
}

interface PlaceBetArgs {
  betId: string;
  betting: Betting;
  userId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { betId, betting, userId } = req.body as PlaceBetArgs;

  if (!betId || !betting || typeof betting !== 'object' || !betting.winnerTeam || !userId) {
    return res.status(400).json({ error: 'Invalid request. Missing or invalid betId, userId or betting data.' });
  }

  try {
    // First, fetch bet details to get event information including startTime
    const { data: betData, error: betError } = await supabase
      .from('bets')
      .select(`
        *,
        events (
          team1,
          team2,
          eventType,
          round,
          startTime
        )
      `)
      .eq('id', betId)
      .single();

    if (betError) {
      throw betError;
    }

    if (!betData) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    // Check if the event has already started
    const startTime = new Date(betData.events.startTime);
    const currentTime = new Date();
    
    if (currentTime > startTime) {
      return res.status(403).json({ 
        error: 'Betting closed', 
        message: 'This event has already started. Betting is no longer available.'
      });
    }

    // Update the database with the new betting data
    const { data, error } = await supabase
      .from('bets') 
      .update({ winnerTeam: betting.winnerTeam, winMargin: betting.winMargin }) 
      .eq('id', betId);

    if (error) {
      throw error;
    }

    // Log the bet to bets_log table
    const { error: logError } = await supabase
      .from('bets_log')
      .insert({
        betId: betId,
        userId: userId,
        winnerTeam: betting.winnerTeam,
        winMargin: betting.winMargin || 0,
        time: new Date().toISOString(),
        team1: betData.events.team1,
        team2: betData.events.team2,
        eventType: betData.events.eventType,
        round: betData.events.round,
        gameNumber: null, // Assuming you want to set this to null for now
      });

    if (logError) {
      console.error('Error logging bet:', logError);
      // We don't want to fail the entire request if just the logging fails
      // So we log the error but still return success
    }

    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error updating bet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}