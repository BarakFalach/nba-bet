'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, XMarkIcon as CrossIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';
import { EnhancedBet } from '@/hooks/useBets';
import useBetCompare from '@/hooks/useBetCompare';

interface ResolvedBetCompareProps {
  bet: EnhancedBet;
  onClose: () => void;
}

export default function ResolvedBetCompare({ bet, onClose }: ResolvedBetCompareProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { team1, team2, team1Score, team2Score } = bet.events;
  const isGameType = bet.events.eventType === 'game' || bet.events.eventType === 'playin';
  const actualWinner = team1Score > team2Score ? team1 : team2;

  const { 
    otherBets, 
    isLoading, 
  } = useBetCompare(bet.id, team1, team2);

  // Animation effect
  useEffect(() => {
    setIsVisible(true);
    
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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

  // Check if user's bet was correct
  const userBetCorrect = bet.winnerTeam === actualWinner;
  
  // Calculate actual point difference for games
  const actualPointDiff = isGameType && team1Score !== undefined && team2Score !== undefined 
    ? Math.abs(team1Score - team2Score)
    : null;
  
  // Check if user's margin was correct (for games: exact point diff, for series: exact games)
  const userMarginCorrect = bet.winMargin !== null && actualPointDiff !== null 
    ? bet.winMargin === actualPointDiff 
    : false;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header with close button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Bet Results
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {/* Actual Result */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Final Result</h3>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <Logo teamName={team1} size="small" />
                <p className="mt-1 text-sm font-medium">{team1}</p>
                {team1Score !== undefined && <p className="text-lg font-bold">{team1Score}</p>}
              </div>
              
              <div className="flex flex-col items-center px-3">
                {isGameType ? (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Point Difference</p>
                    <p className="font-medium">{actualPointDiff}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Series Winner</p>
                    <p className="font-medium">{actualWinner}</p>
                  </>
                )}
              </div>
              
              <div className="flex flex-col items-center">
                <Logo teamName={team2} size="small" />
                <p className="mt-1 text-sm font-medium">{team2}</p>
                {team2Score !== undefined && <p className="text-lg font-bold">{team2Score}</p>}
              </div>
            </div>
          </div>

          {/* Your bet section */}
          <div className={`mb-6 p-3 rounded-lg ${
            userBetCorrect 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Your Bet</h3>
              <div className={`flex items-center ${
                userBetCorrect 
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {userBetCorrect ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Correct</span>
                  </>
                ) : (
                  <>
                    <CrossIcon className="h-4 w-4 mr-1" />
                    <span className="text-xs font-medium">Incorrect</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex flex-1 flex-col items-center">
                <Logo teamName={bet.winnerTeam!} size="small" />
                <p className="mt-1 text-sm font-medium">{bet.winnerTeam}</p>
              </div>
              
              {bet.winMargin !== null && bet.winMargin > 0 && (
                <div className="text-center px-3">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {isGameType ? 'Win margin' : 'In games'}
                  </span>
                  <div className="flex items-center">
                    <span className="font-medium">{bet.winMargin}</span>
                    {userMarginCorrect && (
                      <CheckIcon className="h-4 w-4 ml-1 text-green-500 dark:text-green-400" />
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1">
                <span className="block text-xs text-gray-500 dark:text-gray-400">Points earned</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{(bet.pointsGained ?? 0) + (bet.pointsGainedWinMargin ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Community Results</h3>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Bets</p>
                <p className="text-lg font-medium">{totalBets}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Correct</p>
                <p className="text-lg font-medium text-green-600 dark:text-green-400">{correctBets} <span className="text-xs">({correctPercentage}%)</span></p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-center">
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
              <div className="flex h-2 mb-1 overflow-hidden rounded-full">
                <div 
                  className={`${team1 === actualWinner ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${team1Percentage}%` }}
                />
                <div 
                  className={`${team2 === actualWinner ? 'bg-green-500' : 'bg-red-500'}`}
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
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {otherBets.length > 0 ? "Other Users' Bets" : 'No other bets placed'}
            </h3>
            
            {isLoading ? (
              <div className="py-4 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {otherBets.map((userBet, index) => {
                  const isCorrect = userBet.winnerTeam === actualWinner;
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                            {userBet.name?.charAt(0) || '?'}
                          </div>
                          <span className="ml-2 text-sm font-medium">{userBet.name}</span>
                          
                          {isCorrect ? (
                            <CheckIcon className="h-4 w-4 ml-1 text-green-500" />
                          ) : (
                            <CrossIcon className="h-4 w-4 ml-1 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex flex-col items-center">
                          <Logo teamName={userBet.winnerTeam} size="small" />
                        </div>
                        
                        {userBet.winMargin != null && userBet.winMargin > 0 && (
                          <div className={`ml-2 text-xs px-2 py-1 rounded ${
                            userBet.winnerTeam === actualWinner && 
                            ((isGameType && userBet.winMargin === actualPointDiff) ||
                             (!isGameType && userBet.winMargin === bet.winMargin)) // For series, compare to user bet margin
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}>
                            {isGameType ? `+${userBet.winMargin}` : `${userBet.winMargin}g`}
                          </div>
                        )}
                        
                        {userBet.pointsGained !== undefined && userBet.pointsGained > 0 && (
                          <div className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-200">
                            {userBet.pointsGained + (userBet.pointsGainedWinMargin ?? 0)} pts
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}