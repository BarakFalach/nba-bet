import { useQuery } from '@tanstack/react-query';
import { useUser } from './useUser';
import { QueryKeys } from '@/lib/constants';
import { roundType } from '../types/events';

export type View = roundType | "all";

export interface UserStatsDetail {
  userName: string;
  userEmail: string;
  userId: string;
  totalPointsGain: number;
  correctPredictions: number;
  correctPredictionsWithMargin: number;
  totalBets: number;
  predictionAccuracy: number;
  marginAccuracy: number;
  rank: number;
}

interface OverallBetCompareResponse {
  users: UserStatsDetail[];
  roundType: View;
  totalBets: number;
}

interface OverallBetCompareResult {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: OverallBetCompareResponse | null;
  allUserStats: UserStatsDetail[];
  otherUserStats: UserStatsDetail[];
  currentUserStats: UserStatsDetail | null;
  refetch: () => Promise<any>;
  roundType: View;
  totalBets: number;
}

/**
 * Hook to fetch overall betting statistics for all users
 * Separates current user stats from other users
 * 
 * @param view Filter by round type or 'all' for all rounds
 * @returns Processed stats and React Query state
 */
export function useOverallBetCompare(view: View = 'all'): OverallBetCompareResult {
  const { user } = useUser();
  
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<OverallBetCompareResponse>({
    queryKey: [QueryKeys.OVERALL_BET_COMPARE, view],
    queryFn: async () => {
      const response = await fetch(`/api/overallOtherBets?view=${view}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch overall bet statistics');
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  
  // Extract and process the user stats
  const allUserStats = data?.users || [];
  
  // Find current user's stats
  const currentUserStats = user?.id 
    ? allUserStats.find(stat => stat.userId === user.id) || null
    : null;
  
  // Filter out current user from the list
  const otherUserStats = user?.id
    ? allUserStats.filter(stat => stat.userId !== user.id)
    : allUserStats;
  
  return {
    isLoading,
    isError,
    error: error as Error | null,
    data : data ?? null,
    allUserStats,
    otherUserStats,
    currentUserStats,
    refetch,
    roundType: data?.roundType || view,
    totalBets: data?.totalBets || 0
  };
}

export default useOverallBetCompare;