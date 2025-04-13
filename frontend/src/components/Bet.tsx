'use client';

import React, { useState } from 'react';
import Logo from './Logo';
import PlaceBet, { Bet as BetType, Event } from './PlaceBet';

interface BetProps {
  bet: BetType; 
  event: Event;

}

export default function Bet(props: BetProps) {
  const {  bet } = props;
  const {team1, team2, startTime} = props.event;
  const [isPlaceBetOpen, setIsPlaceBetOpen] = useState(false);

  // Format the date and time
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', // e.g., "Mon"
    month: 'short',   // e.g., "Mar"
    day: '2-digit',   // e.g., "25"
    year: 'numeric',  // e.g., "2025"
  })?.format(new Date(startTime));

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // 12-hour format (e.g., "7:30 PM")
  })?.format(new Date(startTime));

  return (
    <>
      <div
        className={`flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg max-w-md w-full cursor-pointer ${
          bet.winnerTeam
            ? 'bg-gray-100 dark:bg-gray-900' // Default background for placed bets
            : 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' // Highlight for unplaced bets
        }`}
        onClick={() => setIsPlaceBetOpen(true)} // Open PlaceBet on click
      >
        <div className="flex items-center justify-between w-full mb-4">
          {/* Team Logos */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-full overflow-hidden bg-transparent">
              <Logo teamName={team1} />
            </div>
          </div>
  
          {/* Match Info */}
          <div className="text-center mb-4 flex flex-col items-center">
            <p className="text-gray-700 dark:text-gray-300">
              {formattedTime}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {formattedDate}
            </p>
            {!bet.winnerTeam ? (
              <p className="text-blue-600 dark:text-blue-300 font-semibold">
                Place Your Bet!
              </p>
            ) : <p className="text-gray-600 dark:text-blue-300 font-semibold">
                {`Your Bet is on ${bet.winnerTeam}`}
              </p>}
          </div>
  
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 flex items-center justify-center rounded-full overflow-hidden bg-transparent">
              <Logo teamName={team2} />
            </div>
          </div>
        </div>
      </div>
  
      {/* PlaceBet Overlay */}
      {isPlaceBetOpen && (
        <PlaceBet
          bet={bet}
          onClose={() => setIsPlaceBetOpen(false)} // Close PlaceBet
        />
      )}
    </>
  );
}