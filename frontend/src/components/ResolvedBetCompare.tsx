'use client';

import { CheckIcon, XMarkIcon as CrossIcon } from '@heroicons/react/24/outline';
import { EnhancedBet } from '@/hooks/useBets';
import useBetCompare from '@/hooks/useBetCompare';

interface ResolvedBetCompareProps {
  bet: EnhancedBet;
  onCollapse: () => void;
}

export default function ResolvedBetCompare({ bet, onCollapse }: ResolvedBetCompareProps) {
  const { team1, team2, team1Score, team2Score } = bet.events;
  const isGameType = bet.events.eventType === 'game' || bet.events.eventType === 'playin';
  const actualWinner = team1Score > team2Score ? team1 : team2;

  const { 
    otherBets, 
    betsWithoutUser,
    isLoading, 
  } = useBetCompare(bet.id, team1, team2);

  // Count bets per team
  const team1Count = otherBets.filter(userBet => userBet.winnerTeam === team1).length;
  const team2Count = otherBets.filter(userBet => userBet.winnerTeam === team2).length;
  const totalBets = otherBets.length;

  // Calculate percentages
  const team1Percentage = totalBets > 0 ? Math.round((team1Count / totalBets) * 100) : 0;
  const team2Percentage = totalBets > 0 ? Math.round((team2Count / totalBets) * 100) : 0;

  // Calculate correct bets
  const correctBets = otherBets.filter(userBet => userBet.winnerTeam === actualWinner).length;
  const correctPercentage = totalBets > 0 ? Math.round((correctBets / totalBets) * 100) : 0;
  
  // Calculate actual point difference for games
  const actualPointDiff = isGameType && team1Score !== undefined && team2Score !== undefined 
    ? Math.abs(team1Score - team2Score)
    : null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
      <div className="px-4 pb-4">
        {/* Community Stats */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Community Results</h3>
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
            <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-lg text-center shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Correct</p>
              <p className="text-lg font-medium text-green-600 dark:text-green-400">{correctBets} <span className="text-xs">({correctPercentage}%)</span></p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg text-center shadow-sm">
              <p className="text-xs text-gray-500 dark:text-gray-400">Incorrect</p>
              <p className="text-lg font-medium text-red-600 dark:text-red-400">{totalBets - correctBets} <span className="text-xs">({100 - correctPercentage}%)</span></p>
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
                className={`${team1 === actualWinner ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}
                style={{ width: `${team1Percentage}%` }}
              />
              <div 
                className={`${team2 === actualWinner ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}
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
            {betsWithoutUser.length > 0 ? "Other Users' Bets" : 'No other bets placed'}
          </h3>
          
          {isLoading ? (
            <div className="py-4 text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded-lg bg-white dark:bg-gray-750 shadow-sm">
              {betsWithoutUser.length === 0 ? (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No one else placed bets on this event
                </div>
              ) : (
                betsWithoutUser.map((userBet, index) => {
                  const isCorrect = userBet.winnerTeam === actualWinner;
                  
                  return (
                    <div 
                      key={index}
                      className="dark:bg-gray-600 flex items-center py-2 px-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center">

                          <span className="ml-2 text-sm font-medium text-gray-800 dark:text-gray-200">{userBet.name}</span>
                          
                          {isCorrect ? (
                            <CheckIcon className="h-4 w-4 ml-1 text-green-500 dark:text-green-400" />
                          ) : (
                            <CrossIcon className="h-4 w-4 ml-1 text-red-500 dark:text-red-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        
                        {userBet.winMargin != null && userBet.winMargin > 0 && (
                          <div className={`ml-2 text-xs px-2 py-1 rounded ${
                            userBet.winnerTeam === actualWinner && 
                            ((isGameType && userBet.winMargin === actualPointDiff) ||
                             (!isGameType && userBet.winMargin === bet.winMargin)) // For series, compare to user bet margin
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}>
                            {isGameType ? `+${userBet.winMargin}` : `${userBet.winMargin}g`}
                          </div>
                        )}
                        
                        {userBet.pointsGained !== undefined && userBet.pointsGained > 0 && (
                          <div className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded text-blue-800 dark:text-blue-200">
                            {(userBet.pointsGained ?? 0) + (userBet.pointsGainedWinMargin ?? 0)} pts
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}