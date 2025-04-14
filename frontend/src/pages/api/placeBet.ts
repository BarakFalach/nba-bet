import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient'; // Adjust the import path to your Supabase client

interface Betting {
  winnerTeam: string;
  winMargin: number;
}

interface PlaceBetArgs {
  betId: string;
  betting: Betting;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { betId, betting } = req.body as PlaceBetArgs;

  if (!betId || !betting || typeof betting !== 'object' || !betting.winnerTeam) {
    return res.status(400).json({ error: 'Invalid request. Missing or invalid betId or betting data.' });
  }

  try {
    // Update the database with the new betting data
    const { data, error } = await supabase
      .from('bets') // Replace 'bets' with your actual table name
      .update({ winnerTeam: betting.winnerTeam, winMargin: betting.winMargin }) // Update the specific column
      .eq('id', betId); // Match the bet by its ID

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    console.error('Error updating bet:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}