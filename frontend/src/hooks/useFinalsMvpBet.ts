import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from './useUser';
import { useSeason } from './useSeason';
import { QueryKeys } from '@/lib/constants';

interface FinalsMvpBet {
  id: number;
  userId: string;
  playerId: number;
  playerName: string;
  created_at: string;
}

type MvpBetStatus = 'pending_finals' | 'open' | 'closed';

interface FinalsMvpQueryResult {
  finalsMvpBet: FinalsMvpBet | null;
  isLoading: boolean;
  isError: boolean;
  finalsMvpPlayer: string;
  isBetOpen: boolean;
  betStatus: MvpBetStatus;
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
  const { season } = useSeason();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  const {
    data: queryData = null,
    isLoading,
    isError,
  } = useQuery<{ bet: FinalsMvpBet | null; isOpen: boolean; betStatus: MvpBetStatus } | null>({
    queryKey: [QueryKeys.FINALS_MVP_BET, userId, season],
    queryFn: async () => {
      if (!userId) return null;

      const response = await fetch(`/api/finalsMvpBet?userId=${userId}&season=${season}`);
      if (!response.ok) {
        throw new Error('Failed to fetch finals MVP bet');
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
  } = useMutation<FinalsMvpBet, Error, string>({
    mutationFn: async (playerName: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/finalsMvpBet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, playerName, season }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place finals MVP bet');
      }

      return response.json();
    },
    onSuccess: (newBet) => {
      queryClient.setQueryData(
        [QueryKeys.FINALS_MVP_BET, userId, season],
        (prev: { bet: FinalsMvpBet | null; isOpen: boolean; betStatus: MvpBetStatus } | null) =>
          prev ? { ...prev, bet: newBet } : { bet: newBet, isOpen: false, betStatus: 'closed' as MvpBetStatus },
      );
      queryClient.invalidateQueries({ queryKey: [QueryKeys.FINALS_MVP_BET] });
    },
  });

  return {
    finalsMvpBet: queryData?.bet || null,
    finalsMvpPlayer: queryData?.bet?.playerName || '',
    isLoading,
    isError,
    isBetOpen: queryData?.isOpen ?? false,
    betStatus: queryData?.betStatus ?? 'pending_finals',
    placeBet,
    isPlacing,
    error,
  };
}

export default useFinalsMvpBet;
