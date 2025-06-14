'use client';

import { useUser } from '@/hooks/useUser';
import { useBets } from '@/hooks/useBets';
import { useLeaderBoard } from '@/hooks/useLeaderBoard';
import { withAuth } from '@/lib/withAuth';
import { useRouter } from 'next/navigation';
import { TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { CalendarIcon } from '@heroicons/react/24/solid';
import PageLoader from '@/components/PageLoader';
import { useState } from 'react';
import FinalsBet from '@/components/FinalsBet';
import FinalsMvpBet from '@/components/FinalsMvpBet';
import { useFinalsBet } from '@/hooks/useFinalsBet';
import { useFinalsMvpBet } from '@/hooks/useFinalsMvpBet';
import Logo from '@/components/Logo';
import Player from '@/components/Player';

function MainPage() {
  const router = useRouter();
  const { user } = useUser();
  const [showFinalsBetModal, setShowFinalsBetModal] = useState(false);
  const [showFinalsMvpModal, setShowFinalsMvpModal] = useState(false);
  const { finalsBetTeam: finalsBet, isLoading: isFinalsBetLoading } = useFinalsBet();
  const { finalsMvpPlayer: mvpBet, finalsMvpBet, isLoading: isFinalsMvpBetLoading } = useFinalsMvpBet();


  const { unplacedBets, isLoading } = useBets();
  const {
    userRank,
    totalUsers,
    userScore,
    topScore,
    isLoading: isLeaderBoardLoading,
  } = useLeaderBoard();

  const displayName = user?.user_metadata?.displayName || 'Player';
  const pointsBehindLeader = topScore - userScore;

  const completionPercentage = (userScore / topScore) * 100;

  const handleGoToUpcomingBets = () => {
    router.push('/upcoming-bets');
  };

  const handleLeaderboardClick = () => {
    router.push('/leaderboard');
  };

  const handleFinalsBetClick = () => {
    setShowFinalsBetModal(true);
  };

  const handleFinalsMvpClick = () => {
    setShowFinalsMvpModal(true);
  };

  if (isLoading || isLeaderBoardLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col items-center justify-top min-h-screen px-4 dark:bg-gray-900">
      <div className="w-full max-w-2xl space-y-6 pt-4">
        {/* User Welcome Section - Updated design */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-left">
          <div className="flex items-center space-x-4">
            {/* Welcome Text */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Hi,{' '}
                <span className="text-blue-600 dark:text-blue-400">
                  {displayName}
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here is your betting dashboard for the 2025 season
              </p>
            </div>
          </div>
        </div>

        {/* Score & Ranking Card */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
          onClick={handleLeaderboardClick}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Your Stats
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Season 2025
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Your Score
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userScore}
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Rank</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userRank}{' '}
                <span className="text-sm font-normal text-gray-500">
                  of {totalUsers}
                </span>
              </p>
            </div>
          </div>

          {/* Points Behind Leader */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                Points behind leader
              </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {pointsBehindLeader}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Special Bets Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center mb-4">
            <TrophyIcon className="h-5 w-5 mr-2" />
            Your Special Bets
          </h2>

          {/* NBA Finals Bet */}
<div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
  <p className="text-sm text-gray-500 dark:text-gray-400">
    NBA Finals Champion
  </p>
  {isFinalsBetLoading ? (
    <div className="flex items-center mt-2 animate-pulse">
      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
      <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
    </div>
  ) : finalsBet ? (
    <div className="flex items-center justify-between mt-1">
      <div className="flex items-center">
        <div className="w-8 h-8 mr-3">
          <Logo teamName={finalsBet} size="small" />
        </div>
        <p className="text-lg font-medium text-gray-800 dark:text-gray-100">
          {finalsBet}
        </p>
      </div>
      <button
        onClick={handleFinalsBetClick}
        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
        aria-label="Change Finals bet"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    </div>
  ) : (
    <button
      onClick={handleFinalsBetClick}
      className="text-amber-500 dark:text-amber-400 italic text-sm underline mt-1 flex items-center"
    >
      Not placed yet
    </button>
  )}
</div>

          {/* MVP Bet */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Finals MVP
            </p>
            {isFinalsMvpBetLoading ? (
              <div className="flex items-center mt-2 animate-pulse">
                <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
            ) : mvpBet ? (
              <div className="flex items-center justify-between mt-1">
                <Player playerId={finalsMvpBet?.playerId} playerName={finalsMvpBet?.playerName} />
                <button
                  onClick={handleFinalsMvpClick}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 transition-colors"
                  aria-label="Change Finals MVP bet"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={handleFinalsMvpClick}
                className="text-amber-500 dark:text-amber-400 italic text-sm underline mt-1 flex items-center"
              >
                Not placed yet
              </button>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="pt-2">
          <button
            onClick={handleGoToUpcomingBets}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md flex items-center justify-center"
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            Go to My Bets
            {unplacedBets && unplacedBets.length > 0 && (
              <span className="ml-2 bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                {unplacedBets.length} unplaced
              </span>
            )}
          </button>
        </div>
      </div>
      {/* FinalsBet Modal */}
      {showFinalsBetModal && (
        <FinalsBet onClose={() => setShowFinalsBetModal(false)} />
      )}
      {/* FinalsMvpBet Modal */}
      {showFinalsMvpModal && (
        <FinalsMvpBet onClose={() => setShowFinalsMvpModal(false)} />
      )}
    </div>
  );
}

export default withAuth(MainPage);
