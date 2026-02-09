import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from './useUser';
import { useSeason } from './useSeason';
import { QueryKeys } from '@/lib/constants';

interface FinalsBet {
  id?: string;
  userId: string;
  finalsBet: string;
  createdAt?: string;
}

interface FinalsQueryResult {
  finalsBet: FinalsBet | null;
  isLoading: boolean;
  isError: boolean;
  finalsBetTeam: string;
  isBetOpen: boolean;
}

interface FinalsMutationResult {
  placeBet: (teamName: string) => Promise<FinalsBet>;
  isPlacing: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and update a user's Finals bet
 */
export function useFinalsBet(): FinalsQueryResult & FinalsMutationResult {
  const { user } = useUser();
  const { season, seasonConfig } = useSeason();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  // Query to fetch the current finals bet
  const {
    data: finalsBet = null,
    isLoading,
    isError,
  } = useQuery<FinalsBet | null>({
    queryKey: [QueryKeys.FINALS_BET, userId, season],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await fetch(`/api/finalsBet?userId=${userId}&season=${season}`);
      if (!response.ok) {
        throw new Error('Failed to fetch finals bet');
      }
      
      const data = await response.json();
      return data || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to place or update a finals bet
  const {
    mutateAsync: placeBet,
    isPending: isPlacing,
    error,
  } = useMutation<FinalsBet, Error, string>({
    mutationFn: async (teamName: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/finalsBet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          teamName,
          season,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place finals bet');
      }

      return response.json();
    },
    onSuccess: (newBet) => {
      // Update the cache with the new bet data
      queryClient.setQueryData([QueryKeys.FINALS_BET, userId, season], newBet);
      
      // Invalidate and refetch any related queries that might be affected
      queryClient.invalidateQueries({ queryKey: [QueryKeys.FINALS_BET] });
    },
  });

  // Check if betting is still open based on the season-specific deadline
  const isBettingDeadlineReached = () => {
    const deadline = seasonConfig.finalsDeadline;
    const deadlineUTC = new Date(deadline);
    const currentTime = new Date();
    
    return currentTime >= deadlineUTC;
  };
  

  return {
    finalsBet,
    finalsBetTeam: finalsBet?.finalsBet || '',
    isLoading,
    isError,
    isBetOpen: isBettingDeadlineReached(),
    placeBet,
    isPlacing,
    error,
  };
}