import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/constants';
import { useUser } from './useUser';

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
  const {user} = useUser();

  /**
   * Makes an API call to place a bet and updates the local cache
   */
  const placeBet = async ({ betId, betting }: PlaceBetArgs) => {
    // Get the current state of bets
    const previousBets = queryClient.getQueryData<any[]>([QueryKeys.BETS]);

    try {
      // Optimistically update the bets
      updateLocalBet({ betId, betting });

      // Call the API
      const response = await fetch('/api/placeBet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betId, betting, userId: user?.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to place bet');
      }

      // Optionally refetch the bets to ensure consistency
      queryClient.invalidateQueries({ queryKey: [QueryKeys.BETS] });
      
      return await response.json();
    } catch (error) {
      console.error('Error placing bet:', error);

      // Rollback to the previous state if the API call fails
      if (previousBets) {
        queryClient.setQueryData([QueryKeys.BETS], previousBets);
      }

      throw error; // Re-throw the error to handle it in the calling component
    }
  };

  /**
   * Updates only the local bet data without making an API call
   * Useful for temporary UI changes or staging changes before submission
   */
  const updateLocalBet = ({ betId, betting }: PlaceBetArgs) => {
    queryClient.setQueryData([QueryKeys.BETS], (oldBets: any[] | undefined) =>
      oldBets?.map((bet) =>
        bet.id === betId 
          ? { 
              ...bet, 
              winnerTeam: betting.winnerTeam, 
              winMargin: betting.winMargin,
            } 
          : bet
      )
    );
  };

  return { 
    placeBet,    // Updates both local data and server via API
    updateLocalBet // Updates only local data (no API call)
  };
};