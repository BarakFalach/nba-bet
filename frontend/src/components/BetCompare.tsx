'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';
import { EnhancedBet } from '@/hooks/useBets';
import useBetCompare from '@/hooks/useBetCompare';


interface BetCompareProps {
  bet: EnhancedBet;
  onClose: () => void;
}

export default function BetCompare({ bet, onClose }: BetCompareProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { team1, team2 } = bet.events;

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
  const team1Count = otherBets.filter(userBet => userBet.winnerTeam === bet.events.team1).length;
  const team2Count = otherBets.filter(userBet => userBet.winnerTeam === bet.events.team2).length;
  const totalBets = otherBets.length;

  // Calculate percentages
  const team1Percentage = totalBets > 0 ? Math.round((team1Count / totalBets) * 100) : 0;
  const team2Percentage = totalBets > 0 ? Math.round((team2Count / totalBets) * 100) : 0;

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
            Bet Comparison
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {/* Your bet section */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Bet</h3>
            <div className="flex items-center">
              <div className="flex flex-1 flex-col items-center">
                <Logo teamName={bet.winnerTeam!}  />
                <p className="mt-1 text-sm font-medium">{bet.winnerTeam}</p>
              </div>
              
              {bet.winMargin !== null && bet.winMargin > 0 && (
                <div className="text-center px-3">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Win margin</span>
                  <span className="font-medium">{bet.winMargin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Matchup overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Logo teamName={bet.events.team1} size="medium"  />
              </div>
              
              <div className="flex items-center">
                <Logo teamName={bet.events.team2} size="medium"  />
              </div>
            </div>

            {/* Progress bars showing percentages */}
            <div className="flex h-2 mb-1 overflow-hidden rounded-full">
              <div 
                className="bg-blue-500" 
                style={{ width: `${team1Percentage}%` }}
              />
              <div 
                className="bg-red-500" 
                style={{ width: `${team2Percentage}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{team1Percentage}% ({team1Count})</span>
              <span>{team2Percentage}% ({team2Count})</span>
            </div>
          </div>

          {/* Other users' bets */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {otherBets.length > 0 ? "Other Users' Bets" : 'No other bets yet'}
            </h3>
            
            {isLoading ? (
              <div className="py-4 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {otherBets.map((userBet, index) => (
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
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex flex-col items-center">
                        <Logo teamName={userBet.winnerTeam} size="small"  />
                      </div>
                      
                      {userBet.winMargin != null && userBet.winMargin > 0 && (
                        <div className="ml-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                          +{userBet.winMargin}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}