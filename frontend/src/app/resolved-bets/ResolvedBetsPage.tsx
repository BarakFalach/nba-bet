'use client';

import { useState, useMemo } from 'react';
import { useBets } from '@/hooks/useBets';
import { withAuth } from '@/lib/withAuth';
import PageLoader from '@/components/PageLoader';
import ResolvedBet from '@/components/ResolvedBet';
import OverallBetsCompare from '@/components/OverallBetsCompare';
import { roundType } from '../../types/events';
import useOverallBetCompare from '@/hooks/useOverallBetCompare';
import { ChartBarIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

function ResolvedBetsPage() {
  const [activeRound, setActiveRound] = useState<'all' | roundType>('all');
  const [showCompare, setShowCompare] = useState(false);
  
  const { isLoading: isLoadingBets, resolvedBets } = useBets();
  const { currentUserStats, isLoading: isLoadingStats } = useOverallBetCompare(activeRound);

  // Filter bets by selected round
  const filteredBets = useMemo(() => {
    if (activeRound === 'all') return resolvedBets || [];
    return (resolvedBets || []).filter(bet => bet.events.round === activeRound);
  }, [resolvedBets, activeRound]);

  // Get statistics for the current view from your bets
  const betStats = useMemo(() => {
    if (!filteredBets.length) return { total: 0, correct: 0, points: 0 };
    
    return filteredBets.reduce((acc, bet) => {
      const isCorrect = bet.winnerTeam === bet.events.team1 && bet.events.team1Score > bet.events.team2Score
        || bet.winnerTeam === bet.events.team2 && bet.events.team2Score > bet.events.team1Score;
      return {
        total: acc.total + 1,
        correct: acc.correct + (isCorrect ? 1 : 0),
        points: acc.points + ((bet?.pointsGained ?? 0) + (bet?.pointsGainedWinMargin ?? 0))
      };
    }, { total: 0, correct: 0, points: 0 });
  }, [filteredBets]);

  // Round labels for prettier display
  const roundLabels: Record<'all' | roundType, string> = {
    all: 'All Rounds',
    playin: 'Play-In',
    firstRound: 'First Round',
    secondRound: 'Second Round',
    conference: 'Conference Finals',
    finals: 'NBA Finals'
  };
  
  if (isLoadingBets) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-semibold mt-6 mb-4 text-center text-gray-900 dark:text-gray-100">
        Resolved Bets
      </h1>
      
      {/* Round Selector */}
      <div className="w-full max-w-3xl mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          {(['all', 'playin', 'firstRound', 'secondRound', 'conference', 'finals'] as const).map(round => (
            <button
              key={round}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                activeRound === round
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => setActiveRound(round)}
            >
              {roundLabels[round]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats Summary Card with User Statistics */}
      {filteredBets.length > 0 && (
        <div className="w-full max-w-3xl mb-6">
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ${showCompare ? 'rounded-b-none' : ''}`}>
            <div className="px-4 pt-4 pb-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Your Performance 
                  <span className="text-sm font-normal ml-1 text-gray-500 dark:text-gray-400">
                    ({roundLabels[activeRound]})
                  </span>
                </h3>
                {isLoadingStats && (
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bets Placed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{betStats.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Correct Picks</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {betStats.correct} <span className="text-sm font-normal">({Math.round(betStats.correct/betStats.total*100)}%)</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Points Earned</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{betStats.points}</p>
                </div>
              </div>
              
              {/* Additional stats from overall stats */}
              {currentUserStats && !isLoadingStats && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          {currentUserStats.rank}
                        </span>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Leaderboard Rank
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-gray-700 dark:text-gray-300 mr-2">Margin Accuracy</span>
                      <div className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 rounded text-purple-700 dark:text-purple-300 text-xs font-medium">
                        {currentUserStats.marginAccuracy}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Compare button */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {showCompare ? (
                    <>
                      <ChevronUpIcon className="h-4 w-4 mr-1" />
                      Hide leaderboard
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
            <OverallBetsCompare 
              onClose={() => setShowCompare(false)} 
              round={activeRound}
              roundLabel={roundLabels[activeRound]}
            />
          )}
        </div>
      )}
      
      {/* ResolvedBets List */}
      <div className="w-full max-w-3xl space-y-4">
        {filteredBets.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {activeRound === 'all' 
                ? "You don't have any resolved bets yet."
                : `You don't have any resolved bets from the ${roundLabels[activeRound]}.`}
            </p>
          </div>
        ) : (
          filteredBets.map(bet => <ResolvedBet key={bet.id} bet={bet} />)
        )}
      </div>
    </div>
  );
}

export default withAuth(ResolvedBetsPage);