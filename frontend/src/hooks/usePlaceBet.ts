import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/constants';

interface Betting {
  winnerTeam: string;
  winMargin: number;
}

interface PlaceBetArgs {
  betId: string;
  betting: Betting;
}

export const usePlaceBet = () => {
  const queryClient = useQueryClient();

  const placeBetEndPoint = async ({ betId, betting }: PlaceBetArgs) => {
    const response = await fetch('/api/placeBet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ betId, betting }),
    });

    if (!response.ok) {
      throw new Error('Failed to place bet');
    }

    return response.json();
  };

  const placeBet = async ({ betId, betting }: PlaceBetArgs) => {
    // Get the current state of bets
    const previousBets = queryClient.getQueryData<any[]>([QueryKeys.BETS]);

    try {
      // Optimistically update the bets
      queryClient.setQueryData([QueryKeys.BETS], (oldBets: any[] | undefined) =>
        oldBets?.map((bet) =>
          bet.id === betId ? { ...bet, betting } : bet
        )
      );

      // Call the API
      await placeBetEndPoint({ betId, betting });
    } catch (error) {
      console.error('Error placing bet:', error);

      // Rollback to the previous state if the API call fails
      if (previousBets) {
        queryClient.setQueryData([QueryKeys.BETS], previousBets);
      }

      throw error; // Re-throw the error to handle it in the calling component
    }

    // Optionally refetch the bets to ensure consistency
    queryClient.invalidateQueries({ queryKey: [QueryKeys.BETS] });
  };

  return { placeBet };
};