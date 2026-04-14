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
  const { season } = useSeason();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  const {
    data: queryData = null,
    isLoading,
    isError,
  } = useQuery<{ bet: FinalsBet | null; isOpen: boolean } | null>({
    queryKey: [QueryKeys.FINALS_BET, userId, season],
    queryFn: async () => {
      if (!userId) return null;

      const response = await fetch(`/api/finalsBet?userId=${userId}&season=${season}`);
      if (!response.ok) {
        throw new Error('Failed to fetch finals bet');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, teamName, season }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place finals bet');
      }

      return response.json();
    },
    onSuccess: (newBet) => {
      queryClient.setQueryData(
        [QueryKeys.FINALS_BET, userId, season],
        (prev: { bet: FinalsBet | null; isOpen: boolean } | null) =>
          prev ? { ...prev, bet: newBet } : { bet: newBet, isOpen: false },
      );
      queryClient.invalidateQueries({ queryKey: [QueryKeys.FINALS_BET] });
    },
  });

  return {
    finalsBet: queryData?.bet || null,
    finalsBetTeam: queryData?.bet?.finalsBet || '',
    isLoading,
    isError,
    isBetOpen: queryData?.isOpen ?? false,
    placeBet,
    isPlacing,
    error,
  };
}
