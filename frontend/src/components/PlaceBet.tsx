import React, { useState } from 'react';
import Logo from './Logo';
import { usePlaceBet } from '@/hooks/usePlaceBet';
import { EnhancedBet } from '@/hooks/useBets';
import { XCircleIcon } from '@heroicons/react/24/solid';

interface PlaceBetProps {
  bet: EnhancedBet;
  onClose: () => void;
}

const PlaceBet: React.FC<PlaceBetProps> = ({ bet, onClose }) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(bet.winnerTeam);
  const [pointDiff, setPointDiff] = useState<number | ''>(bet.winMargin || '');
  const { placeBet, isLoading, error, clearError } = usePlaceBet();

  // Determine if this is a game-type event (game or playin) or a series
  const isGameType = bet.events.eventType === 'game' || bet.events.eventType === 'playin';

  // Direct placement without confirmation
  const handlePlaceBet = async () => {
    if (!selectedTeam) {
      alert('Please select a team to place your bet.');
      return;
    }

    if (pointDiff === '' || pointDiff < 0) {
      alert(`Please enter a valid ${isGameType ? 'point difference' : 'series length'}.`);
      return;
    }

    // For series, validate that it's one of the allowed values: 4, 5, 6, 7
    if (!isGameType && ![4, 5, 6, 7].includes(Number(pointDiff))) {
      alert('Series length must be 4, 5, 6, or 7 games.');
      return;
    }

    try {
      // Place bet and wait for response
      await placeBet({ 
        betId: bet.id, 
        betting: {
          winnerTeam: selectedTeam,
          winMargin: Number(pointDiff),
        } 
      });
      
      // Only close if successful
      onClose();
    } catch {
      // Error will be captured in the error state
      // No need to handle here as we'll display it in the UI
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
          Place Your Bet
        </h2>

        {/* Subtle notice about bet finality */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4 italic">
          Once submitted, bets cannot be changed
        </p>

        {/* Error display */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative">
            <div className="flex items-start">
              <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Failed to place bet</p>
                <p className="text-sm">{error?.message}</p>
              </div>
              <button 
                onClick={clearError}
                className="ml-4 text-red-500 hover:text-red-700 dark:hover:text-red-300"
                aria-label="Dismiss error"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Event Info */}
        <p className="text-center text-gray-700 dark:text-gray-300 mb-6">
          <span className="font-semibold">{bet.events.team1}</span> vs{' '}
          <span className="font-semibold">{bet.events.team2}</span>
        </p>

        {/* Team Selection */}
        <div className="flex flex-col gap-2 mb-6">
          <button
            className={`flex items-center justify-start py-3 px-4 rounded-lg text-lg font-semibold transition-all ${
              selectedTeam === bet.events.team1
                ? 'bg-blue-400 text-white shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105 active:scale-95'
            }`}
            onClick={() => setSelectedTeam(bet.events.team1)}
            disabled={isLoading}
          >
            <div className="flex items-center gap-6">
              <Logo teamName={bet.events.team1} />
              <span>{bet.events.team1}</span>
            </div>
          </button>
          <button
            className={`flex items-center justify-start py-3 px-4 rounded-lg text-lg font-semibold transition-all ${
              selectedTeam === bet.events.team2
                ? 'bg-blue-400 text-white shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105 active:scale-95'
            }`}
            onClick={() => setSelectedTeam(bet.events.team2)}
            disabled={isLoading}
          >
            <div className="flex items-center gap-6">
              <Logo teamName={bet.events.team2} />
              <span>{bet.events.team2}</span>
            </div>
          </button>
        </div>

        {/* Point Difference/Series Length Input */}
        {isGameType ? (
          // Point Difference Input for game/playin
          <div className="mb-6">
            <label
              htmlFor="point-diff"
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Point Difference Guess
            </label>
            <input
              type="number"
              id="point-diff"
              value={pointDiff}
              onChange={(e) => setPointDiff(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your point difference guess"
              min="0"
              disabled={isLoading}
            />
          </div>
        ) : (
          // Series Length Selector for series
          <div className="mb-6">
            <label
              className="block text-gray-700 dark:text-gray-300 font-semibold mb-2"
            >
              Series Length (Games)
            </label>
            <div className="flex justify-between gap-2">
              {[4, 5, 6, 7].map((games) => (
                <button
                  key={games}
                  type="button"
                  onClick={() => setPointDiff(games)}
                  className={`flex-1 py-3 px-2 rounded-lg text-center transition-all ${
                    pointDiff === games
                      ? 'bg-blue-400 text-white shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  disabled={isLoading}
                >
                  {games}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Select the number of games it will take to complete the series
            </p>
          </div>
        )}

        {/* Visual finality indicator - icon and subtle message */}
        <div className="flex items-center justify-center mb-4 text-sm text-amber-600 dark:text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Finality notice: Your bet will be permanent
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-4">
          <button
            className={`py-3 px-4 ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-lg transition-all flex items-center justify-center gap-2 min-w-[150px]`}
            onClick={handlePlaceBet}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Placing Bet...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Place Final Bet</span>
              </>
            )}
          </button>
          <button
            className="py-3 px-4 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceBet;