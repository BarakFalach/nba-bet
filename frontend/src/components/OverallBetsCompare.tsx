'use client';

import { CheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import useOverallBetCompare from '@/hooks/useOverallBetCompare';
import { useState, useEffect } from 'react';
import { roundType } from '../types/events';

interface OverallBetsCompareProps {
  onClose: () => void;
  round: roundType | 'all';
  roundLabel: string;
}

export default function OverallBetsCompare({ round, roundLabel }: OverallBetsCompareProps) {
  const [, setIsVisible] = useState(false);
  const { 
    allUserStats, 
    currentUserStats, 
    isLoading 
  } = useOverallBetCompare(round);

  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Helper for rank ordinals (1st, 2nd, 3rd, etc.)
  const getOrdinal = (position: number): string => {
    if (!position) return '';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = position % 100;
    return position + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
  };

  // Format percentage for display
  const formatPercentage = (value: number): string => `${value}%`;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
      <div className="px-4 pb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <ChartBarIcon className="h-4 w-4 mr-2 text-blue-500" />
            {roundLabel} Statistics
          </h3>
        </div>

        {/* Current User's Performance */}
        {currentUserStats && (
          <div className="mb-5 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 text-sm font-bold">
                    {getOrdinal(currentUserStats.rank)}
                  </span>
                </div>
                <div className="ml-2">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{currentUserStats.userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your performance</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{currentUserStats.totalPointsGain}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Points</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Prediction Accuracy</span>
                  <span className="text-xs font-medium">{formatPercentage(currentUserStats.predictionAccuracy)}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 dark:bg-green-400"
                    style={{ width: `${currentUserStats.predictionAccuracy}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {currentUserStats.correctPredictions} correct out of {currentUserStats.totalBets} bets
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Margin Accuracy</span>
                  <span className="text-xs font-medium">{formatPercentage(currentUserStats.marginAccuracy)}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 dark:bg-purple-400"
                    style={{ width: `${currentUserStats.marginAccuracy}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {currentUserStats.correctPredictionsWithMargin} perfect out of {currentUserStats.correctPredictions} correct
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          
          {isLoading ? (
            <div className="py-6 text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="overflow-y-auto rounded-lg bg-white dark:bg-gray-700 shadow-sm">
              {allUserStats.length === 0 ? (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No data available for this round
                </div>
              ) : (
                <>
                  {/* Header row - UPDATED GRID */}
                  <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 grid grid-cols-10">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">User</div>
                    <div className="col-span-2 text-center">Accuracy</div>
                    <div className="col-span-2 text-center">Margin</div>
                    <div className="col-span-1 text-right">Points</div>
                  </div>
                  
                  {/* User rows - UPDATED GRID */}
                  {allUserStats.map((stats) => {
                    const isCurrentUser = stats.userId === currentUserStats?.userId;
                    
                    return (
                      <div 
                        key={stats.userId} 
                        className={`grid grid-cols-10 px-3 py-2 text-sm border-b border-gray-100 dark:border-gray-600 last:border-0 ${
                          isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="col-span-1 flex items-center">
                          {stats.rank <= 3 ? (
                            <span className={`
                              flex items-center justify-center w-5 h-5 rounded-full text-xs text-white
                              ${stats.rank === 1 ? 'bg-yellow-500' : stats.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'}
                            `}>
                              {stats.rank}
                            </span>
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400 text-xs">{stats.rank}</span>
                          )}
                        </div>
                        
                        <div className="col-span-4 text-gray-800 dark:text-gray-200 flex items-center">
                          <span className="truncate">{stats.userName}</span>
                          {isCurrentUser && (
                            <span className="ml-1 text-xs text-blue-500">(You)</span>
                          )}
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300">
                            <CheckIcon className="w-3 h-3 mr-0.5 text-green-500" />
                            {formatPercentage(stats.predictionAccuracy)}
                          </div>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300">
                            {formatPercentage(stats.marginAccuracy)}
                          </div>
                        </div>
                        
                        <div className="col-span-1 text-right font-bold text-blue-600 dark:text-blue-400">
                          {stats.totalPointsGain}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}