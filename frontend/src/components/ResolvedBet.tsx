import React, { useState } from 'react';
import { EnhancedBet } from '@/hooks/useBets';
import Logo from './Logo';
import { ChartBarIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ResolvedBetCompare from './ResolvedBetCompare';

interface ResolvedBetProps {
  bet: EnhancedBet;
}

export default function ResolvedBet({ bet }: ResolvedBetProps) {
  const [showCompare, setShowCompare] = useState(false);
  
  const { 
    events: { 
      team1, team2, startTime, round, eventType, team1Score, team2Score 
    },
    winnerTeam: predictedWinner,
    winMargin,
    pointsGainedWinMargin, 
    pointsGained,
  } = bet;

  const actualWinner = team1Score > team2Score ? team1 : team2;

  const pointsEarned = (pointsGained ?? 0) + (pointsGainedWinMargin ?? 0);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
  }).format(new Date(startTime));

  const isCorrect = predictedWinner === actualWinner;
  const isGameType = eventType === 'game' || eventType === 'playin';
  const isExactScoreDiff = isGameType && winMargin === Math.abs(team1Score - team2Score);
  
  // Different layouts based on round type
  if (round === 'playin' || (round === 'conference' && isGameType) || (round === 'finals' && isGameType)) {
    return renderGameResult();
  } else if (['firstRound', 'secondRound'].includes(round || '') || 
             (round === 'conference' && eventType === 'series') || 
             (round === 'finals' && eventType === 'series')) {
    return renderSeriesResult();
  }

  // Fallback to default game layout if we can't determine type
  return renderGameResult();

  function renderGameResult() {
    return (
      <div className="overflow-hidden shadow-md rounded-xl">
        <div className={`bg-white dark:bg-gray-800 ${!showCompare && 'rounded-xl'} ${showCompare && 'rounded-t-xl'} ${isCorrect ? 'border-l-4 border-green-500' : ''}`}>
          {/* Header - Show date and points earned */}
          <div className="dark:bg-gray-600 bg-gray-50 dark:bg-gray-750 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-100">{formattedDate}</span>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Points earned:</span>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                {pointsEarned}
              </span>
            </div>
          </div>

          {/* Content - Game result */}
          <div className="p-4">
            <div className="flex justify-between items-center">
              {/* Team 1 */}
              <div className={`flex flex-col items-center ${team1 === actualWinner ? 'font-bold' : ''}`}>
                <Logo teamName={team1} size="small" />
                <span className="mt-1">{team1}</span>
                <span className="text-xl font-bold">{team1Score}</span>
              </div>

              {/* Center - Result Indicators */}
              <div className="text-center">
                <div className={`text-sm mb-2 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isCorrect ? 'Correct prediction!' : 'Wrong prediction'}
                </div>
                
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm">Your bet</p>
                  <p className="font-medium">{predictedWinner}</p>
                  {winMargin && winMargin > 0 && (
                    <p className="text-xs mt-1">
                      Win by {winMargin} {isExactScoreDiff && '✓'}
                    </p>
                  )}
                </div>
              </div>

              {/* Team 2 */}
              <div className={`flex flex-col items-center ${team2 === actualWinner ? 'font-bold' : ''}`}>
                <Logo teamName={team2} size="small" />
                <span className="mt-1">{team2}</span>
                <span className="text-xl font-bold">{team2Score}</span>
              </div>
            </div>
            
            {/* Compare button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowCompare(!showCompare)}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
          </div>
        </div>
        
        {/* Expanded comparison section */}
        {showCompare && (
          <ResolvedBetCompare bet={bet} onCollapse={() => setShowCompare(false)} />
        )}
      </div>
    );
  }

  function renderSeriesResult() {
    // For series bets, we need actual series data like games won
    const team1Wins = 4; // This should come from the actual data
    const team2Wins = 2; // This should come from the actual data
    
    return (
      <div className="overflow-hidden shadow-md rounded-xl">
        <div className={`bg-white dark:bg-gray-800 ${!showCompare && 'rounded-xl'} ${showCompare && 'rounded-t-xl'} ${isCorrect ? 'border-l-4 border-green-500' : ''}`}>
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-750 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Series Result</span>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Points earned:</span>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                {pointsEarned}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              {/* Team 1 */}
              <div className={`flex flex-col items-center ${team1 === actualWinner ? 'font-bold' : ''}`}>
                <Logo teamName={team1} size="small" />
                <span className="mt-1">{team1}</span>
                <span className="text-xl font-bold">{team1Wins}</span>
              </div>

              {/* Series visualization */}
              <div className="flex space-x-1">
                {[...Array(7)].map((_, i) => {
                  const isTeam1Win = i < team1Wins;
                  const isTeam2Win = i < team2Wins;
                  
                  return (
                    <div 
                      key={i} 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${isTeam1Win ? 'bg-blue-500 text-white' : 
                          isTeam2Win ? 'bg-red-500 text-white' : 
                          'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        }`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>

              {/* Team 2 */}
              <div className={`flex flex-col items-center ${team2 === actualWinner ? 'font-bold' : ''}`}>
                <Logo teamName={team2} size="small" />
                <span className="mt-1">{team2}</span>
                <span className="text-xl font-bold">{team2Wins}</span>
              </div>
            </div>
            
            {/* Your prediction */}
            <div className="flex justify-center mb-4">
              <div className={`text-center px-4 py-2 rounded-lg ${
                isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 
                            'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                <p className="text-sm">Your prediction</p>
                <p className="font-medium">{predictedWinner}</p>
                {winMargin && winMargin > 0 && (
                  <p className="text-xs mt-1">
                    In {winMargin} games {winMargin === team1Wins + team2Wins && '✓'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Compare button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowCompare(!showCompare)}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
          </div>
        </div>
        
        {/* Expanded comparison section */}
        {showCompare && (
          <ResolvedBetCompare bet={bet} onCollapse={() => setShowCompare(false)} />
        )}
      </div>
    );
  }
}