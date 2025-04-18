'use client';

import { useLeaderBoard } from '@/hooks/useLeaderBoard';
import { withAuth } from '@/lib/withAuth';
import { useUser } from '@/hooks/useUser';
import { TrophyIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

function LeaderBoardPage() {
  const { leaderboard, userRank, userScore, isLoading } = useLeaderBoard();
  const { user } = useUser();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading scores...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-top min-h-screen px-4 bg-white dark:bg-gray-900">
      <div className="w-full max-w-2xl space-y-6 pt-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Leaderboard
          </h1>
          <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
            <p className="text-sm text-blue-600 dark:text-blue-300">
              <span className="font-medium">Your Rank:</span> {userRank || '-'}
            </p>
          </div>
        </div>
        
        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {leaderboard && leaderboard.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.email.toLowerCase() === user?.email?.toLowerCase();
                
                // Determine medal for top 3
                let medal = <></>;
                if (index === 0) {
                  medal = <span className="text-yellow-500 text-lg">🥇</span>;
                } else if (index === 1) {
                  medal = <span className="text-gray-400 text-lg">🥈</span>;
                }
                
                return (
                  <li 
                    key={entry.email}
                    className={`py-3 px-4 flex items-center justify-between ${
                      isCurrentUser 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-8 text-right text-gray-500 dark:text-gray-400 font-medium">
                        {index + 1}
                      </span>
                      
                      {medal && <span>{medal}</span>}
                      
                      <div className={`font-medium ${
                        isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {entry.name || entry.email.split('@')[0]}
                        {isCurrentUser && <span className="ml-2 text-xs text-blue-500">(You)</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-14 text-right font-semibold text-gray-900 dark:text-gray-100">
                        {entry.score}
                      </div>
                      <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">pts</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <TrophyIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                No leaderboard data available yet.
              </p>
            </div>
          )}
        </div>
        
        {/* Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-500" />
            Your Stats
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your Score</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userScore}</p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your Rank</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userRank || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(LeaderBoardPage);