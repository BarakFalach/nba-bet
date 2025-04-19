import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/constants';
import { useUser } from './useUser';
import { useState } from 'react';

interface Betting {
  winnerTeam: string;
  winMargin: number;
}

interface PlaceBetArgs {
  betId: string;
  betting: Betting;
}

interface PlaceBetResult {
  placeBet: (args: PlaceBetArgs) => Promise<any>;
  updateLocalBet: (args: PlaceBetArgs) => void;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

export const usePlaceBet = (): PlaceBetResult => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Clears the current error state
   */
  const clearError = () => setError(null);

  /**
   * Makes an API call to place a bet and updates the local cache
   */
  const placeBet = async ({ betId, betting }: PlaceBetArgs) => {
    // Get the current state of bets
    const previousBets = queryClient.getQueryData<any[]>([QueryKeys.BETS]);
    
    // Clear any previous errors
    clearError();
    // Set loading state
    setIsLoading(true);

    try {
      // Optimistically update the bets

      // Call the API
      const response = await fetch('/api/placeBet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betId, betting, userId: user?.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Failed to place bet');
      }
      updateLocalBet({ betId, betting });

      // Optionally refetch the bets to ensure consistency
      queryClient.invalidateQueries({ queryKey: [QueryKeys.BETS] });
      
      const result = await response.json();
      setIsLoading(false);
      return result;
    } catch (error) {
      console.error('Error placing bet:', error);

      // Rollback to the previous state if the API call fails
      if (previousBets) {
        queryClient.setQueryData([QueryKeys.BETS], previousBets);
      }

      // Set error state
      setError(error instanceof Error ? error : new Error('An unknown error occurred'));
      setIsLoading(false);
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
    placeBet,       // Updates both local data and server via API
    updateLocalBet, // Updates only local data (no API call)
    isLoading,      // Loading state for UI feedback
    error,          // Error state for displaying error messages
    clearError      // Function to clear error state
  };
};