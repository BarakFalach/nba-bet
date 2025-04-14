'use client';

import React, { useState } from 'react';
import Logo from './Logo';
import PlaceBet, { Bet as BetType, Event } from './PlaceBet';

interface BetProps {
  bet: BetType;
  event: Event;
}

export default function Bet(props: BetProps) {
  const { bet } = props;
  const { team1, team2, startTime } = props.event;
  const [isPlaceBetOpen, setIsPlaceBetOpen] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Jerusalem',
  weekday: 'short',
  month: 'short',
  day: '2-digit',
  year: 'numeric',
}).format(new Date(startTime));

const formattedTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Jerusalem',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}).format(new Date(startTime));


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
          <div className="text-center flex flex-col items-center space-y-1">
            <p className="text-gray-700 dark:text-gray-300">{formattedTime}</p>
            <p className="text-gray-700 dark:text-gray-300">{formattedDate}</p>

            {/* Team Bet Status */}
            {!bet.winnerTeam ? (
              <p className="text-blue-600 dark:text-blue-300 font-semibold">
                Place Your Bet!
              </p>
            ) : (
              <div className="px-3 py-1 rounded-lg">
                <p className="text-green-700 dark:text-green-300 font-semibold">
                  You bet on <span className="font-bold">{bet.winnerTeam}</span>
                </p>

                {/* Win Margin Display */}
                {bet.winMargin > 0 && (
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Win margin:{' '}
                    <span className="font-bold">{bet.winMargin} points</span>
                  </p>
                )}
              </div>
            )}

            {/* Only show Points Diff prompt if no team is selected */}
            {!bet.winnerTeam && !bet.winMargin && (
              <p className="text-blue-600 dark:text-blue-300 font-semibold text-sm">
                Set point difference
              </p>
            )}
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
