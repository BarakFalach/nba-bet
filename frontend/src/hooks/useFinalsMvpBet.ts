import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from './useUser';

interface FinalsMvpBet {
  id: number;
  userId: string;
  playerId: number;
  playerName: string;
  created_at: string;
}

interface FinalsMvpQueryResult {
  finalsMvpBet: FinalsMvpBet | null;
  isLoading: boolean;
  isError: boolean;
  finalsMvpPlayer: string;
  isBetOpen: boolean;
}

interface FinalsMvpMutationResult {
  placeBet: (playerName: string) => Promise<FinalsMvpBet>;
  isPlacing: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and update a user's Finals MVP bet
 */
export function useFinalsMvpBet(): FinalsMvpQueryResult & FinalsMvpMutationResult {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  // Query to fetch the current finals MVP bet
  const {
    data: finalsMvpBet = null,
    isLoading,
    isError,
  } = useQuery<FinalsMvpBet | null>({
    queryKey: ['finalsMvpBet', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await fetch(`/api/finalsMvpBet?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch finals MVP bet');
      }
      
      const data = await response.json();
      return data || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  console.log('Finals MVP Bet:', finalsMvpBet);

  // Mutation to place or update a finals MVP bet
  const {
    mutateAsync: placeBet,
    isPending: isPlacing,
    error,
  } = useMutation<FinalsMvpBet, Error, string>({
    mutationFn: async (playerName: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/finalsMvpBet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          playerName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place finals MVP bet');
      }

      return response.json();
    },
    onSuccess: (newBet) => {
      // Update the cache with the new bet data
      queryClient.setQueryData(['finalsMvpBet', userId], newBet);
      
      // Invalidate and refetch any related queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['finalsMvpBet'] });
    },
  });

  // Check if betting is still open based on the deadline
  const isBettingDeadlineReached = () => {
    // Deadline: June 30, 2025 at 20:00:00 UTC
    const deadlineUTC = new Date('2025-06-30T20:00:00Z');
    const currentTime = new Date();
    
    return currentTime >= deadlineUTC;
  };


  return {
    finalsMvpBet,
    finalsMvpPlayer: finalsMvpBet?.playerName || '',
    isLoading,
    isError,
    isBetOpen: !isBettingDeadlineReached(), // Note: Changed to be consistent with the name (open means betting is allowed)
    placeBet,
    isPlacing,
    error,
  };
}

export default useFinalsMvpBet;