'use client';

import { EnhancedBet } from '@/hooks/useBets';
import useBetCompare from '@/hooks/useBetCompare';
import Logo from './Logo';

interface BetCompareProps {
  bet: EnhancedBet;
  onCollapse: () => void;
}

export default function BetCompare({ bet, onCollapse }: BetCompareProps) {
  const { team1, team2 } = bet.events;

  const { 
    otherBets, 
    isLoading, 
    betsWithoutUser,
  } = useBetCompare(bet.id, team1, team2);

  // Count bets per team
  const team1Count = otherBets.filter(userBet => userBet.winnerTeam === bet.events.team1).length;
  const team2Count = otherBets.filter(userBet => userBet.winnerTeam === bet.events.team2).length;
  const totalBets = otherBets.length;

  // Calculate percentages
  const team1Percentage = totalBets > 0 ? Math.round((team1Count / totalBets) * 100) : 0;
  const team2Percentage = totalBets > 0 ? Math.round((team2Count / totalBets) * 100) : 0;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 bg-gray-50 dark:bg-gray-800 rounded-b-xl animate-slideUp overflow-hidden">
      <div className="px-4 pb-4">
        {/* Community Stats */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Community Bets</h3>
            <button 
              onClick={onCollapse}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Hide details
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white dark:bg-gray-700 p-2 rounded-lg text-center shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Bets</p>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{totalBets}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-center shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">{team1}</p>
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">{team1Count} <span className="text-xs">({team1Percentage}%)</span></p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg text-center shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">{team2}</p>
              <p className="text-lg font-medium text-red-600 dark:text-red-400">{team2Count} <span className="text-xs">({team2Percentage}%)</span></p>
            </div>
          </div>

          {/* Progress bars showing bet distribution */}
          <div className="mb-1">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>{team1}</span>
              <span>{team2}</span>
            </div>
            <div className="flex h-2 mb-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div 
                className="bg-blue-500 dark:bg-blue-400"
                style={{ width: `${team1Percentage}%` }}
              />
              <div 
                className="bg-red-500 dark:bg-red-400"
                style={{ width: `${team2Percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{team1Percentage}% ({team1Count})</span>
              <span>{team2Percentage}% ({team2Count})</span>
            </div>
          </div>
        </div>

        {/* Other users' bets */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {betsWithoutUser.length > 0 ? "Other Users' Bets" : 'No other bets yet'}
          </h3>
          
          {isLoading ? (
            <div className="py-4 text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded-lg bg-white dark:bg-gray-600 shadow-sm">
              {betsWithoutUser.length === 0 ? (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No one else has placed bets on this event yet
                </div>
              ) : (
                betsWithoutUser.map((userBet, index) => (
                  <div 
                    key={index}
                    className="flex items-center py-2 px-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{userBet.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        <Logo teamName={userBet.winnerTeam} size="xsmall" />
                        
                        {userBet.winMargin != null && userBet.winMargin > 0 && (
                          <div className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">
                            {bet.events.eventType === 'game' || bet.events.eventType === 'playin' 
                              ? `+${userBet.winMargin}` 
                              : `${userBet.winMargin}g`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}