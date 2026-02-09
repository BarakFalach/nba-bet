import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

// Helper to build season filter for events table
const LEGACY_SEASON = 2025;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId, season } = req.query;
  const seasonNum = season ? Number(season) : null;

  try {
    // Build the query with season filter on events
    let query = supabase
      .from('bets')
      .select(`
        *,
        events:eventId!inner (*)
      `)
      .eq('userId', userId);

    // Filter by season (NULL in DB means 2025)
    if (seasonNum === LEGACY_SEASON || seasonNum === null) {
      query = query.is('events.season', null);
    } else {
      query = query.eq('events.season', seasonNum);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'An unknown error occurred' });
  }
}