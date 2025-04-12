import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date().toISOString(); // Get today's date in ISO format

    // Query bets where closeTime is before today and userId is '2'
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .gt('closeTime', today) // closeTime is less than today
      .eq('userId', '2'); // userId is equal to '2'

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