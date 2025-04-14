import React, { useState } from 'react';
import Logo from './Logo'; // Import the Logo component
import { usePlaceBet } from '@/hooks/usePlaceBet';

export interface Bet {
  id: string;
  winnerTeam: string | null;
  winMargin: number;
  result: string;
  pointsGained: number;
  pointsGainedWinMargin: number;
  calcFunc: string;
  closeTime: string;
  created_at: string;
  userId: string;
  eventId: number;
  events: Event;
}

export interface Event {
  id: number;
  team1: string;
  team2: string;
  startTime: string;
  eventType: string;
  round: string;
  parseEvent: string;
  team1Score: number;
  team2Score: number;
  status: number;
}

interface PlaceBetProps {
  bet: Bet;
  onClose: () => void; // Callback to close the overlay
}

const PlaceBet: React.FC<PlaceBetProps> = ({ bet, onClose }) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(bet.winnerTeam);
  const [pointDiff, setPointDiff] = useState<number | ''>(bet.winMargin || '');
  const [showFinalWarning, setShowFinalWarning] = useState(false); // State to track whether warning is shown
  const { placeBet } = usePlaceBet();

  // Validate and prepare for placement
  const handlePlaceButtonClick = () => {
    if (!selectedTeam) {
      alert('Please select a team to place your bet.');
      return;
    }

    if (pointDiff === '' || pointDiff < 0) {
      alert('Please enter a valid point difference.');
      return;
    }

    // Only show the warning if bet is new or values have changed
    if (!bet.winnerTeam || bet.winnerTeam !== selectedTeam || bet.winMargin !== pointDiff) {
      setShowFinalWarning(true);
    } else {
      // If nothing changed, just close
      onClose();
    }
  };

  // Final submission after warning acknowledgment
  const handleFinalSubmission = () => {
    placeBet({ 
      betId: bet.id, 
      betting: {
        winnerTeam: selectedTeam || '',
        winMargin: Number(pointDiff),
      } 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
          onClick={onClose}
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
                ? 'bg-blue-400 text-white shadow-lg scale-105' // Selected state
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105 active:scale-95'
            }`}
            onClick={() => setSelectedTeam(bet.events.team1)}
          >
            <div className="flex items-center gap-6">
              <Logo teamName={bet.events.team1} /> {/* Team 1 Logo */}
              <span>{bet.events.team1}</span>
            </div>
          </button>
          <button
            className={`flex items-center justify-start py-3 px-4 rounded-lg text-lg font-semibold transition-all ${
              selectedTeam === bet.events.team2
                ? 'bg-blue-400 text-white shadow-lg scale-105' // Selected state
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105 active:scale-95'
            }`}
            onClick={() => setSelectedTeam(bet.events.team2)}
          >
            <div className="flex items-center gap-6">
              <Logo teamName={bet.events.team2} /> {/* Team 2 Logo */}
              <span>{bet.events.team2}</span>
            </div>
          </button>
        </div>

        {/* Point Difference Input */}
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
          />
        </div>

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
            className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            onClick={handlePlaceButtonClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Place Final Bet
          </button>
          <button
            className="py-3 px-4 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Confirmation Dialog (appears when showFinalWarning is true) */}
      {showFinalWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-xs w-full">
            <div className="text-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-bold mt-2 text-gray-900 dark:text-gray-100">Final Confirmation</h3>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
              You are placing a bet on <strong>{selectedTeam}</strong> 
              {pointDiff ? ` with a ${pointDiff} point margin` : ''}.
              <br /><br />
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                This action cannot be undone.
              </span>
            </p>
            
            <div className="flex justify-between gap-3">
              <button
                className="flex-1 py-2 px-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
                onClick={() => setShowFinalWarning(false)}
              >
                Go Back
              </button>
              <button
                className="flex-1 py-2 px-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all"
                onClick={handleFinalSubmission}
              >
                Confirm Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceBet;