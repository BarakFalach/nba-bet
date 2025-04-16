'use client';

import { useState, useMemo } from 'react';
import { useBets } from '@/hooks/useBets';
import { withAuth } from '@/lib/withAuth';
import PageLoader from '@/components/PageLoader';
import ResolvedBet from '@/components/ResolvedBet';
import { roundType } from '../../types/events';

// import { ChevronDoubleRightIcon } from '@heroicons/react/24/outline';

function ResolvedBetsPage() {
  const [activeRound, setActiveRound] = useState<'all' | roundType>('all');
  const { isLoading, resolvedBets } = useBets();

  // Filter bets by selected round
  const filteredBets = useMemo(() => {
    if (activeRound === 'all') return resolvedBets || [];
    return (resolvedBets || []).filter(bet => bet.events.round === activeRound);
  }, [resolvedBets, activeRound]);

  // Get statistics for the current view
  const stats = useMemo(() => {
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
    all: 'All Bets',
    playin: 'Play-In',
    firstRound: 'First Round',
    secondRound: 'Second Round',
    conference: 'Conference Finals',
    finals: 'NBA Finals'
  };
  
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 bg-white dark:bg-black">
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
      
      {/* Stats Summary Card */}
      {filteredBets.length > 0 && (
        <div className="w-full max-w-3xl mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Bets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Correct Predictions</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.correct} <span className="text-sm font-normal">({Math.round(stats.correct/stats.total*100)}%)</span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Points Earned</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.points}</p>
              </div>
            </div>
          </div>
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