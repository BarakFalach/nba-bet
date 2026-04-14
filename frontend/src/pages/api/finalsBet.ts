import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

const LEGACY_SEASON = 2025;
const CURRENT_SEASON = 2026;

// Fallback deadline for legacy season (2025) — not used for 2026+
const LEGACY_FINALS_DEADLINE = '2025-04-19T20:00:00Z';

async function getBettingDeadline(season: number): Promise<Date | null> {
  if (season === LEGACY_SEASON) {
    return new Date(LEGACY_FINALS_DEADLINE);
  }
  const { data } = await supabase
    .from('events')
    .select('startTime')
    .eq('eventType', 'finalsChampion')
    .eq('season', season)
    .maybeSingle();
  return data?.startTime ? new Date(data.startTime) : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request to fetch a user's finals bet
  if (req.method === 'GET') {
    const { userId, season } = req.query;
    const seasonNum = season ? Number(season) : CURRENT_SEASON;
    const isLegacySeason = seasonNum === LEGACY_SEASON;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId parameter' });
    }

    try {
      const deadline = await getBettingDeadline(seasonNum);
      const isOpen = deadline !== null && new Date() < deadline;

      let query = supabase
        .from('finals_bet')
        .select('*')
        .eq('userId', userId);

      if (isLegacySeason) {
        query = query.is('season', null);
      } else {
        query = query.eq('season', seasonNum);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return res.status(200).json({ bet: data || null, isOpen });
    } catch (error) {
      console.error('Error fetching finals bet:', error);
      return res.status(500).json({ message: 'Failed to fetch finals bet' });
    }
  }

  // Handle POST request to create or update a finals bet
  if (req.method === 'POST') {
    const { userId, teamName, season } = req.body;
    const seasonNum = season ? Number(season) : CURRENT_SEASON;
    const isLegacySeason = seasonNum === LEGACY_SEASON;
    const dbSeason = isLegacySeason ? null : seasonNum;

    if (!userId || !teamName) {
      return res.status(400).json({ message: 'Missing required fields: userId and teamName' });
    }

    const deadline = await getBettingDeadline(seasonNum);
    if (deadline === null) {
      return res.status(503).json({ message: 'Betting deadline not available yet' });
    }
    if (new Date() >= deadline) {
      return res.status(403).json({
        message: 'Betting is closed',
        details: 'The deadline for placing finals bets has passed.',
      });
    }

    try {
      let existingQuery = supabase
        .from('finals_bet')
        .select('*')
        .eq('userId', userId);

      if (isLegacySeason) {
        existingQuery = existingQuery.is('season', null);
      } else {
        existingQuery = existingQuery.eq('season', seasonNum);
      }

      const { data: existingBet, error: fetchError } = await existingQuery.single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      let result;

      if (existingBet) {
        const { data, error: updateError } = await supabase
          .from('finals_bet')
          .update({ finalsBet: teamName, created_at: new Date().toISOString() })
          .eq('id', existingBet.id)
          .select()
          .single();
        if (updateError) throw updateError;
        result = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('finals_bet')
          .insert({ userId, finalsBet: teamName, season: dbSeason, created_at: new Date().toISOString() })
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

  return res.status(405).json({ message: 'Method not allowed' });
}
