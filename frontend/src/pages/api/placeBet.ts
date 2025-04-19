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

// Define log event types for clarity
enum BetLogEventType {
  INTERACTION_START = 'interaction_start',
  PLACEMENT_COMPLETE = 'placement_complete',
  VALIDATION_FAILURE = 'validation_failure',
  SERVER_ERROR = 'server_error'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { betId, betting, userId } = req.body as PlaceBetArgs;
  const timestamp = new Date().toISOString();
  
  // Log the start of the interaction
  const { error: startLogError } = await supabase
    .from('bets_log')
    .insert({
      betId: betId,
      userId: userId,
      winnerTeam: betting?.winnerTeam || null,
      winMargin: betting?.winMargin || null,
      time: timestamp,
      logEventType: BetLogEventType.INTERACTION_START,
      status: 'started',
    });
  
  if (startLogError) {
    console.error('Error logging bet interaction start:', startLogError);
  }

  // Validate request data
  if (!betId || !betting || typeof betting !== 'object' || !betting.winnerTeam || !userId) {
    // Log validation failure
    await supabase
      .from('bets_log')
      .insert({
        betId: betId || null,
        userId: userId || null,
        winnerTeam: betting?.winnerTeam || null,
        winMargin: betting?.winMargin || null,
        time: new Date().toISOString(),
        logEventType: BetLogEventType.VALIDATION_FAILURE,
        status: 'failed',
        error: 'Invalid request data',
      });
      
    return res.status(400).json({ 
      error: 'Invalid request', 
      message: 'Missing or invalid betId, userId or betting data.' 
    });
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
      // Log bet not found error
      await supabase
        .from('bets_log')
        .insert({
          betId: betId,
          userId: userId,
          winnerTeam: betting.winnerTeam,
          winMargin: betting.winMargin || 0,
          time: new Date().toISOString(),
          logEventType: BetLogEventType.VALIDATION_FAILURE,
          status: 'failed',
          error: 'Bet not found'
        });
        
      return res.status(404).json({ 
        error: 'Bet not found', 
        message: 'The specified bet does not exist'
      });
    }

    // Check if the event has already started
    const startTime = new Date(betData.events.startTime);
    const currentTime = new Date();
    
    if (currentTime > startTime) {
      // Log deadline passed error
      await supabase
        .from('bets_log')
        .insert({
          betId: betId,
          userId: userId,
          winnerTeam: betting.winnerTeam,
          winMargin: betting.winMargin || 0,
          time: new Date().toISOString(),
          logEventType: BetLogEventType.VALIDATION_FAILURE,
          status: 'failed',
          error: 'Betting deadline passed',
        });
        
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

    // Log successful bet placement
    const { error: completeLogError } = await supabase
      .from('bets_log')
      .insert({
        betId: betId,
        userId: userId,
        winnerTeam: betting.winnerTeam,
        winMargin: betting.winMargin || 0,
        time: new Date().toISOString(),
        team1: betData.events.team1,
        team2: betData.events.team2,
        logEventType: BetLogEventType.PLACEMENT_COMPLETE,
        status: 'completed',
        round: betData.events.round,
        eventType: betData.events.eventType,
      });

    if (completeLogError) {
      console.error('Error logging bet completion:', completeLogError);
      // We don't want to fail the entire request if just the logging fails
    }

    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error updating bet:', error);
    
    // Log server error
    await supabase
      .from('bets_log')
      .insert({
        betId: betId,
        userId: userId,
        winnerTeam: betting.winnerTeam,
        winMargin: betting.winMargin || 0,
        time: new Date().toISOString(),
        logEventType: BetLogEventType.SERVER_ERROR,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to place your bet. Please try again.'
    });
  }
}