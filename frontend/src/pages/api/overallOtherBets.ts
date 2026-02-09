import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { roundType } from '../../types/events';

export type View = roundType | "all";

const LEGACY_SEASON = 2025;

interface UserStats {
  userName: string;
  userEmail: string;
  userId: string;
  totalPointsGain: number;
  correctPredictions: number;
  correctPredictionsWithMargin: number;
  totalBets: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extract view and season parameters
    const { view, season } = req.query;
    const seasonNum = season ? Number(season) : null;
    const isLegacySeason = seasonNum === LEGACY_SEASON || seasonNum === null;
    
    if (!view) {
      return res.status(400).json({ error: 'Missing required query parameter: view' });
    }
    
    if (typeof view !== 'string' || 
        (view !== 'all' && 
         view !== 'playin' && 
         view !== 'firstRound' && 
         view !== 'secondRound' && 
         view !== 'conference' && 
         view !== 'finals')) {
      return res.status(400).json({ error: 'Invalid view parameter' });
    }
    
    // Step 1: Fetch all completed bets with event information
    let query = supabase
      .from('bets')
      .select(`
        id,
        userId,
        winnerTeam,
        winMargin,
        pointsGained,
        pointsGainedWinMargin,
        events!inner (
          id,
          team1,
          team1Score,
          team2,
          team2Score,
          round,
          status,
          season
        )
      `)
      // Only include resolved bets (status = 3)
      .eq('events.status', 3);
    
    // Filter by season (NULL in DB means 2025)
    if (isLegacySeason) {
      query = query.is('events.season', null);
    } else {
      query = query.eq('events.season', seasonNum);
    }
    
    // Filter by round if not "all"
    if (view !== 'all') {
      query = query.eq('events.round', view);
    }
    
    const { data: bets, error: betsError } = await query;
    
    if (betsError) {
      console.error('Error fetching bets:', betsError);
      return res.status(500).json({ error: 'Failed to fetch bet data' });
    }
    
    if (!bets || bets.length === 0) {
      return res.status(200).json({ users: [] });
    }
    
    // Step 2: Group and aggregate data by userId
    const userStatsMap = new Map<string, UserStats>();
    
    // Extract all unique userIds for fetching user info
    const userIds = [...new Set(bets.map(bet => bet.userId))];
    
    // Fetch user details from the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('uuid, name, email')
      .in('uuid', userIds);
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }
    
    // Create a mapping of user IDs to user details
    const userMap = new Map(users?.map(user => [user.uuid, { name: user.name, email: user.email }]) || []);
    
    // Process each bet to calculate stats
    bets.forEach(bet => {
      const userId = bet.userId;
      
      // Skip bets with missing required data
      if (!userId) return;
      
      const userInfo = userMap.get(userId) || { name: 'Unknown', email: '' };
      
      // Initialize user stats if not exists
      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          userName: userInfo.name,
          userEmail: userInfo.email,
          userId,
          totalPointsGain: 0,
          correctPredictions: 0,
          correctPredictionsWithMargin: 0,
          totalBets: 0
        });
      }
      
      const stats = userStatsMap.get(userId)!;
      
      // Increment total bets counter
      stats.totalBets += 1;
      
      // Add points gained (winner + margin)
      const pointsGained = bet.pointsGained || 0;
      const pointsGainedWinMargin = bet.pointsGainedWinMargin || 0;
      stats.totalPointsGain += (pointsGained + pointsGainedWinMargin);
      
      // Check if user had correct winner prediction
      if (pointsGained > 0) {
        stats.correctPredictions += 1;
        
        // Check if user also had correct margin prediction
        if (pointsGainedWinMargin > 0) {
          stats.correctPredictionsWithMargin += 1;
        }
      }
    });
    
    // Step 3: Convert map to array and sort by total points (descending)
    const userStatsList = Array.from(userStatsMap.values())
      .sort((a, b) => b.totalPointsGain - a.totalPointsGain);
    
    // Add percentage calculations for better visualization
    const enhancedStats = userStatsList.map(stats => ({
      ...stats,
      predictionAccuracy: stats.totalBets > 0 
        ? Math.round((stats.correctPredictions / stats.totalBets) * 100) 
        : 0,
      marginAccuracy: stats.correctPredictions > 0 
        ? Math.round((stats.correctPredictionsWithMargin / stats.correctPredictions) * 100) 
        : 0,
      rank: 0 // Will be calculated in the next step
    }));
    
    // Add ranking
    enhancedStats.forEach((stat, index) => {
      stat.rank = index + 1;
    });
    
    return res.status(200).json({ 
      users: enhancedStats,
      roundType: view,
      totalBets: bets.length
    });
    
  } catch (error) {
    console.error('Error in overallOtherBets API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}