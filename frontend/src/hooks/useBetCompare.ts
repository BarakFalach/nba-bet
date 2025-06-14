import { useQuery } from '@tanstack/react-query';
import { useUser } from './useUser';

// Types for the hook
export interface UserBet {
  userId: string;
  name: string;
  winnerTeam: string;
  winMargin?: number;
  pointsGained?: number;
  pointsGainedWinMargin?: number;
}

interface BetStats {
  team1Count: number;
  team2Count: number;
  team1Percentage: number;
  team2Percentage: number;
  totalBets: number;
  yourBet?: UserBet;
}

interface BetCompareResult {
  betId: string;
  otherBets: UserBet[];
  betsWithoutUser: UserBet[];
  sortedBetsByWinMargin: UserBet[];
  sortedBetsByTeamAndMargin: UserBet[]; // Added this new property
  isLoading: boolean;
  error: Error | null;
  stats: BetStats;
  refetch: () => void;
}

/**
 * Hook to fetch and analyze other users' bets for a specific bet
 * 
 * @param betId The ID of the bet to compare
 * @param team1 The name of team 1
 * @param team2 The name of team 2
 * @returns Object with bet comparisons, statistics, and loading state
 */
export function useBetCompare(betId: string, team1: string, team2: string): BetCompareResult {
  const { user } = useUser();
  
  // Fetch other users' bets
  const {
    data: otherBets = [],
    isLoading,
    error,
    refetch
  } = useQuery<UserBet[]>({
    queryKey: ['otherBets', betId],
    queryFn: () => fetch(`/api/otherBets?betId=${betId}`).then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch bet comparisons');
      }
      return res.json();
    }),
    enabled: !!betId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const betsWithoutUser = user?.id 
    ? otherBets.filter(bet => bet.userId !== user.id)
    : otherBets;

  // Sort betsWithoutUser by total points earned (descending)
  const sortedBetsByPoints = [...betsWithoutUser].sort((a, b) => {
    const totalPointsA = (a.pointsGained || 0) + (a.pointsGainedWinMargin || 0);
    const totalPointsB = (b.pointsGained || 0) + (b.pointsGainedWinMargin || 0);
    return totalPointsB - totalPointsA; // Descending order
  });

  // Sort betsWithoutUser by winMargin (ascending)
  const sortedBetsByWinMargin = [...betsWithoutUser].sort((a, b) => {
    return (a.winMargin || 0) - (b.winMargin || 0); // Ascending order
  });

  // Sort by team first, then by winMargin within each team group
  const sortedBetsByTeamAndMargin = [...betsWithoutUser].sort((a, b) => {
    // First, sort by team (team1 first, then team2)
    if (a.winnerTeam !== b.winnerTeam) {
      return a.winnerTeam === team1 ? -1 : 1;
    }
    
    // Then sort by win margin (ascending)
    return (a.winMargin || 0) - (b.winMargin || 0);
  });

  // Calculate statistics based on fetched data
  const calculateStats = (): BetStats => {
    if (!otherBets?.length) {
      return {
        team1Count: 0,
        team2Count: 0,
        team1Percentage: 0,
        team2Percentage: 0,
        totalBets: 0
      };
    }
    
    // Find current user's bet
    const yourBet = user?.id 
      ? otherBets.find(bet => bet.userId === user.id) 
      : undefined;
    
    // Count bets for each team
    const team1Count = otherBets.filter(bet => bet.winnerTeam === team1).length;
    const team2Count = otherBets.filter(bet => bet.winnerTeam === team2).length;
    const totalBets = otherBets.length;
    
    // Calculate percentages
    const team1Percentage = totalBets > 0 ? Math.round((team1Count / totalBets) * 100) : 0;
    const team2Percentage = totalBets > 0 ? Math.round((team2Count / totalBets) * 100) : 0;
    
    return {
      team1Count,
      team2Count,
      team1Percentage,
      team2Percentage,
      totalBets,
      yourBet
    };
  };
  
  // Get stats based on current data
  const stats = calculateStats();

  return {
    betId,
    otherBets,
    betsWithoutUser: sortedBetsByPoints, // Keep the current behavior
    sortedBetsByWinMargin,
    sortedBetsByTeamAndMargin, // New sorted array by team then margin
    isLoading,
    error: error as Error | null,
    stats,
    refetch
  };
}

export default useBetCompare;