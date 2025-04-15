'use client';

import { useUser } from '@/hooks/useUser';
import { useBets } from '@/hooks/useBets';
import { useLeaderBoard } from '@/hooks/useLeaderBoard';
import { withAuth } from '@/lib/withAuth';
import { useRouter } from 'next/navigation';
import { TrophyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { CalendarIcon } from '@heroicons/react/24/solid';
import PageLoader from '@/components/PageLoader';

function MainPage() {
  const router = useRouter();
  const { user } = useUser();
  const {} = useLeaderBoard();
  const { unplacedBets, isLoading } = useBets();
  const { userRank, totalUsers, userScore, topScore, isLoading: isLeaderBoardLoading } = useLeaderBoard();

  const displayName = user?.user_metadata?.displayName || 'Player';
  const pointsBehindLeader = topScore - userScore;
  
  const completionPercentage = ((userScore) / (topScore)) * 100;
  
  const finalsBet = ""
  
  const mvpBet = ""

  const handleGoToUpcomingBets = () => {
    router.push('/upcoming-bets');
  };

  const handleLeaderboardClick = () => {
    router.push('/leaderboard');
  }

  if (isLoading || isLeaderBoardLoading) {
    return (
      <PageLoader/>
    );
  }

  return (
    <div className="flex flex-col items-center justify-top min-h-screen px-4 dark:bg-black">
    <div className="w-full max-w-2xl space-y-6 pt-4">
      {/* User Welcome Section - Updated design */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-left">
        <div className="flex items-center space-x-4">
          
          {/* Welcome Text */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Hi, <span className="text-blue-600 dark:text-blue-400">{displayName}</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here is your betting dashboard for the 2025 season
            </p>
          </div>
        </div>
      </div>
        
        {/* Score & Ranking Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4" onClick={handleLeaderboardClick}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Your Stats
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Season 2025</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your Score</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userScore}</p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Rank</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userRank} <span className="text-sm font-normal text-gray-500">of {totalUsers}</span>
              </p>
            </div>
          </div>
          
          {/* Points Behind Leader */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Points behind leader</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{pointsBehindLeader}</span>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">NBA Finals Champion</p>
            {finalsBet ? (
              <p className="text-lg font-medium text-gray-800 dark:text-gray-100">{finalsBet}</p>
            ) : (
              <p className="text-amber-500 dark:text-amber-400 italic text-sm">Not placed yet</p>
            )}
          </div>
          
          {/* MVP Bet */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Season MVP</p>
            {mvpBet ? (
              <p className="text-lg font-medium text-gray-800 dark:text-gray-100">{mvpBet}</p>
            ) : (
              <p className="text-amber-500 dark:text-amber-400 italic text-sm">Not placed yet</p>
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
    </div>
  );
}

export default withAuth(MainPage);