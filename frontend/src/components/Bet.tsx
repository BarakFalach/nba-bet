'use client';

import React, { useState, useMemo } from 'react';
import Logo from './Logo';
import PlaceBet from './PlaceBet';
import { EnhancedBet } from '@/hooks/useBets';
import EventType from './EventType';
import BetCompare from './BetCompare';
import { ChartBarIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { nbaTeamColors } from '@/lib/teamColors';

interface BetProps {
  bet: EnhancedBet;
}

export default function Bet(props: BetProps) {
  const { bet } = props;
  const { team1, team2, startTime, eventType, gameNumber } = bet?.events;
  const [isPlaceBetOpen, setIsPlaceBetOpen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }).format(new Date(startTime));

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(startTime));

  // Determine if this is a game-type event (game or playin) or a series
  const isGameType = eventType === 'game' || eventType === 'playin';

  // Get team colors from the nbaTeamColors map (with fallbacks)
  const team1Color = nbaTeamColors[team1 as keyof typeof nbaTeamColors] || '#3B82F6';
  const team2Color = nbaTeamColors[team2 as keyof typeof nbaTeamColors] || '#EF4444';

  const withOpacity = (hexColor: string, opacity: number) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };
    
      // Create background gradient style
      const backgroundStyle = useMemo(() => {
        // For placed bets, use team colors with lower opacity
        // For unplaced bets, use more prominent colors with blue border
        if (bet.winnerTeam) {
          return {
            background: `linear-gradient(135deg, ${withOpacity(team1Color, 0.5)} 0%, ${withOpacity(team1Color, 0.2)} 49%, ${withOpacity(team2Color, 0.2)} 51%, ${withOpacity(team2Color, 0.5)} 100%)`,
          };
        } 
        return {
          background: `linear-gradient(135deg, ${withOpacity(team1Color, 0.5)} 0%, ${withOpacity(team1Color, 0.2)} 49%, ${withOpacity(team2Color, 0.2)} 51%, ${withOpacity(team2Color, 0.5)} 100%)`,
          border: '2px solid #3B82F6', // Keep the blue border
        }
      }, [bet.winnerTeam, team1Color, team2Color]);

  return (
    <div className="overflow-hidden shadow-lg rounded-xl max-w-md w-full">
      <div
        style={backgroundStyle}
        className={`flex flex-col items-center justify-center p-4 relative ${
          showCompare ? 'rounded-t-xl' : 'rounded-xl'
        } ${
          bet.winnerTeam
            ? 'dark:bg-opacity-90 dark:bg-gray-800' // Dark mode background for placed bets
            : 'dark:bg-blue-900/30' // Dark mode highlight for unplaced bets
        }`}
        onClick={() => {
          if (bet.winnerTeam === null) {
            setIsPlaceBetOpen(true);
          }
        }}
      >
        {/* Create a semi-transparent overlay for better readability in dark mode */}
        <div className="absolute inset-0 bg-white dark:bg-gray-800 opacity-0 dark:opacity-60 rounded-xl pointer-events-none"></div>
        
        <div className="absolute top-0 left-0 z-4">
          <EventType bet={bet} />
        </div>
        {/* Game Number Indicator */}
        {isGameType && gameNumber && (
          <div className="absolute top-0 right-0 z-4 bg-gray-800 text-white px-3 py-1 rounded-bl-lg text-sm font-semibold">
            Game {gameNumber}
          </div>
        )}
        
        {/* Content wrapper with top padding */}
        <div className="w-full pt-4">
          <div className="flex items-center justify-between w-full mb-4 z-4 relative">
            {/* Team Logos */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full overflow-hidden">
                <Logo teamName={team1} />
              </div>
            </div>

            {/* Match Info */}
            <div className="text-center flex flex-col items-center space-y-1">
              <p className="text-gray-700 dark:text-gray-300">{formattedDate} • {formattedTime}</p>

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
              <div className="w-16 h-16 flex items-center justify-center rounded-full overflow-hidden">
                <Logo teamName={team2} />
              </div>
            </div>
          </div>

          {/* Only show compare button if bet is placed */}
          {bet.winnerTeam && (
            <div className="mt-2 flex justify-center z-4 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering parent click
                  setShowCompare(!showCompare);
                }}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {showCompare ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4 mr-1" />
                    Hide comparison
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    Compare with others
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded comparison section */}
      {showCompare && bet.winnerTeam && (
        <BetCompare bet={bet} onCollapse={() => setShowCompare(false)} />
      )}

      {/* PlaceBet Overlay */}
      {isPlaceBetOpen && (
        <PlaceBet
          bet={bet}
          onClose={() => setIsPlaceBetOpen(false)}
        />
      )}
    </div>
  );
}