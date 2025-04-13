import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const {userId} = req.query;




  try {
    const today = new Date();
    
    const { data, error } = await supabase
    .from('bets')
    .select(`
      *,
      events:eventId (*)
    `)
    .gt('closeTime', today.toISOString())
    .eq('userId', userId);


    if (error) {
      debugger
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