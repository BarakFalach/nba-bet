import React, { useState } from 'react';
import Logo from './Logo'; // Import the Logo component
import { usePlaceBet } from '@/hooks/usePlaceBet';

export interface Bet {
  id: number;
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
  const {placeBet} = usePlaceBet();

  const handlePlaceBet = () => {
    if (!selectedTeam) {
      alert('Please select a team to place your bet.');
      return;
    }
    placeBet({betId: bet.id, winnerTeam: selectedTeam});
    onClose(); // Close the overlay after placing the bet
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl p-6 w-full max-w-md relative overflow-hidden">
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
          Place Your Bet
        </h2>

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
            className={`flex items-center justify-left py-3 px-4 rounded-lg text-lg font-semibold transition-all ${
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

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-4">
          <button
            className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            onClick={handlePlaceBet}
          >
            Place Bet
          </button>
          <button
            className="py-3 px-4 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceBet;
