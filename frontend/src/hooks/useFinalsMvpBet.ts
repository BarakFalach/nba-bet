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
  pointsGained?: number | null;
}

interface FinalsTeams {
  team1: string;
  team2: string;
}

export interface FinalsPlayer {
  playerId: number;
  playerName: string;
}

type MvpBetStatus = 'pending_finals' | 'open' | 'closed';

interface FinalsMvpQueryResult {
  finalsMvpBet: FinalsMvpBet | null;
  isLoading: boolean;
  isError: boolean;
  finalsMvpPlayer: string;
  isBetOpen: boolean;
  betStatus: MvpBetStatus;
  finalsTeams: FinalsTeams | null;
  mvpBetPointsGained: number | null;
}

interface FinalsMvpMutationResult {
  placeBet: (selection: FinalsPlayer) => Promise<FinalsMvpBet>;
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
  } = useQuery<{
    bet: FinalsMvpBet | null;
    isOpen: boolean;
    betStatus: MvpBetStatus;
    finalsTeams: FinalsTeams | null;
  } | null>({
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
  } = useMutation<FinalsMvpBet, Error, FinalsPlayer>({
    mutationFn: async (selection: FinalsPlayer) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/finalsMvpBet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          playerId: selection.playerId,
          playerName: selection.playerName,
          season,
        }),
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
        (prev: {
          bet: FinalsMvpBet | null;
          isOpen: boolean;
          betStatus: MvpBetStatus;
          finalsTeams: FinalsTeams | null;
        } | null) =>
          prev
            ? { ...prev, bet: newBet }
            : { bet: newBet, isOpen: false, betStatus: 'closed' as MvpBetStatus, finalsTeams: null },
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
    finalsTeams: queryData?.finalsTeams ?? null,
    mvpBetPointsGained: queryData?.bet?.pointsGained ?? null,
    placeBet,
    isPlacing,
    error,
  };
}

export function useFinalsMvpTeamRoster(teamName: string | null) {
  const { season } = useSeason();

  return useQuery<{ players: FinalsPlayer[] }>({
    queryKey: [QueryKeys.FINALS_MVP_BET, 'roster', teamName, season],
    queryFn: async () => {
      const response = await fetch(
        `/api/finalsMvpBet?teamName=${encodeURIComponent(teamName!)}&season=${season}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch team roster');
      }
      return response.json();
    },
    enabled: !!teamName,
    staleTime: 1000 * 60 * 30,
  });
}

export default useFinalsMvpBet;
