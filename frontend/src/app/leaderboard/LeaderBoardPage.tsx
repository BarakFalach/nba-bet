'use client';

import { useLeaderBoard } from '@/hooks/useLeaderBoard';
import { withAuth } from '@/lib/withAuth';
import { useUser } from '@/hooks/useUser';
import { TrophyIcon, ArrowTrendingUpIcon, StarIcon } from '@heroicons/react/24/outline';
import Logo from '@/components/Logo';
import { nbaTeamColors } from '@/lib/teamColors';

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
            <div>
              {/* Table Header */}
              <div className="bg-gray-50 dark:bg-gray-600 py-2 px-4 grid grid-cols-12 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Name</div>
                <div className="col-span-3 text-center">Finals Pick</div>
                <div className="col-span-3 text-right">Points</div>
              </div>
              
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.email.toLowerCase() === user?.email?.toLowerCase();
                  
                  // Determine medal for top 3
                  let medal: any | null = null;
                  if (index === 0) {
                    medal = <span className="text-yellow-500 text-lg">🥇</span>;
                  } else if (index === 1) {
                    medal = <span className="text-gray-400 text-lg">🥈</span>;
                  } else if (index === 2) {
                    medal = <span className="text-amber-700 text-lg">🥉</span>;
                  }
                  
                  return (
                    <li 
                      key={entry.email}
                      className={`py-3 px-4 grid grid-cols-12 items-center ${
                        isCurrentUser 
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      {/* Rank & Medal */}
                      <div className="col-span-1 flex justify-center items-center">
                        {medal ? (
                          <span>{medal}</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      
                      {/* User Name */}
                      <div className={`col-span-5 font-medium ${
                        isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {entry.name || entry.email.split('@')[0]}
                        {isCurrentUser && <span className="ml-2 text-xs text-blue-500">(You)</span>}
                      </div>
                      
                      {/* Finals Bet */}
                      <div className="col-span-3 flex justify-center">
                        {entry.finalsBet ? (
                          <div className="flex items-center space-x-1">
                            <Logo teamName={entry.finalsBet} size="xsmall" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">
                              {entry.finalsBet}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-600 italic">
                            No pick
                          </span>
                        )}
                      </div>
                      
                      {/* Score */}
                      <div className="col-span-3 flex items-center justify-end">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {entry.score}
                        </div>
                        <span className="ml-1 text-gray-500 dark:text-gray-400 text-xs">pts</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="p-8 text-center">
              <TrophyIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                No leaderboard data available yet.
              </p>
            </div>
          )}
        </div>
        
        {/* Stats Card - Now includes Finals Bet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-500" />
            Your Stats
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your Score</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userScore}</p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Your Rank</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userRank || '-'}</p>
            </div>
          </div>
          
          {/* Finals Bet Card */}
{user && (
  <div className="relative p-4 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
    {/* Dynamic background gradient based on team */}
    {leaderboard?.find(entry => entry.email.toLowerCase() === user.email?.toLowerCase())?.finalsBet && (
      <div 
        className="absolute inset-0 pointer-events-none opacity-15 dark:opacity-25" 
        style={{ 
          background: (() => {
            const teamName = leaderboard.find(entry => entry.email.toLowerCase() === user.email?.toLowerCase())?.finalsBet;
            if (!teamName) return "linear-gradient(to right, #f9fafb, #f3f4f6)";
            
            const teamColor = nbaTeamColors[teamName as keyof typeof nbaTeamColors] || '#3B82F6';
            const withOpacity = (hexColor: string, opacity: number) => {
              const hex = hexColor.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            };
            
            return `linear-gradient(135deg, ${withOpacity(teamColor, 1)} 0%, ${withOpacity(teamColor, 0.6)} 50%, ${withOpacity(teamColor, 0.2)} 100%)`;
          })()
        }}
      />
    )}
    
    <div className="relative z-10">
      <div className="flex items-center">
        <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">Your Finals Champion Pick</p>
      </div>
      
      {leaderboard?.find(entry => entry.email.toLowerCase() === user.email?.toLowerCase())?.finalsBet ? (
        <div className="mt-3 flex items-center space-x-2">
          <Logo 
            teamName={leaderboard.find(entry => entry.email.toLowerCase() === user.email?.toLowerCase())?.finalsBet || ''} 
            size="small" 
          />
          <span 
            className="font-medium text-lg" 
            style={{ 
              color: (() => {
                const teamName = leaderboard.find(entry => entry.email.toLowerCase() === user.email?.toLowerCase())?.finalsBet;
                if (!teamName) return ''; 
                return nbaTeamColors[teamName as keyof typeof nbaTeamColors] || '';
              })()
            }}
          >
            {leaderboard.find(entry => entry.email.toLowerCase() === user.email?.toLowerCase())?.finalsBet}
          </span>
        </div>
      ) : (
        <div className="mt-3 flex items-center space-y-2">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg w-full">
            <p className="text-gray-500 dark:text-gray-400 italic">
              You have not picked a finals champion yet
            </p>
            <a href="/finals" className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Make your prediction now →
            </a>
          </div>
        </div>
      )}
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
}

export default withAuth(LeaderBoardPage);