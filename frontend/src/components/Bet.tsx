'use client';

import React, { useState } from 'react';
import Logo from './Logo';
import PlaceBet from './PlaceBet';
import { EnhancedBet } from '@/hooks/useBets';
import EventType from './EventType';
import BetCompare from './BetCompare';

interface BetProps {
  bet: EnhancedBet;
}

export default function Bet(props: BetProps) {
  const { bet } = props;
  const { team1, team2, startTime, eventType } = bet?.events;
  const [isPlaceBetOpen, setIsPlaceBetOpen] = useState(false);
  const [isBetCompareOpen, setIsBetCompareOpen] = useState(false);

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

  // Determine if this is a game-type event (game or playin) or a series
  const isGameType = eventType === 'game' || eventType === 'playin';

  return (
    <>
      <div
        className={`flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg max-w-md w-full cursor-pointer relative ${
          bet.winnerTeam
            ? 'bg-gray-100 dark:bg-gray-900' // Default background for placed bets
            : 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' // Highlight for unplaced bets
        }`}
        onClick={() => {
          if (bet.winnerTeam === null) {
            setIsPlaceBetOpen(true);
          } else {
            setIsBetCompareOpen(true);
          }
        }}
      >
        <div className="absolute top-0 left-0 z-2">
          <EventType bet={bet} />
        </div>
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

                {/* Conditional display based on event type */}
                {bet?.winMargin !== null && bet.winMargin > 0 && (
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    {isGameType ? (
                      <>Win margin: <span className="font-bold">{bet.winMargin} points</span></>
                    ) : (
                      <>In <span className="font-bold">{bet.winMargin} games</span></>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Only show prompt if no team is selected */}
            {!bet.winnerTeam && !bet.winMargin && (
              <p className="text-blue-600 dark:text-blue-300 font-semibold text-sm">
                {isGameType ? 'Set point difference' : 'Set series length'}
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
          onClose={() => setIsPlaceBetOpen(false)}
        />
      )}
      {isBetCompareOpen && (
        <BetCompare
          bet={bet}
          onClose={() => setIsBetCompareOpen(false)}
        />
      )}
    </>
  );
}