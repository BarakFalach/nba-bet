'use client';

import { useState } from 'react';
import Bet from '@/components/Bet';
import { useBets } from '@/hooks/useBets';
import { withAuth } from '@/lib/withAuth';
import PageLoader from '@/components/PageLoader';

function UpcomingBetsPage() {
  const [activeTab, setActiveTab] = useState<'unplaced' | 'placed'>('unplaced');
  const { isLoading, unplacedBets, placedBets } = useBets();

  if (isLoading) {
    return (
      <PageLoader/>
    );
  }

  // Get the active bets based on the selected tab
  const activeBets = activeTab === 'unplaced' ? unplacedBets : placedBets;

  return (
    <div className="flex flex-col items-center justify-top min-h-screen px-4 bg-white dark:bg-black">
      <h1 className="text-3xl font-semibold mt-6 mb-8 text-center text-gray-900 dark:text-gray-100">
        Your Upcoming Bets
      </h1>

      {/* Tab Navigation */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium transition ${
              activeTab === 'unplaced'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('unplaced')}
          >
            Unplaced Bets
            {unplacedBets?.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white dark:bg-gray-700 text-blue-500 dark:text-white text-xs rounded-full">
                {unplacedBets?.length}
              </span>
            )}
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium transition ${
              activeTab === 'placed'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('placed')}
          >
            Placed Bets
            {placedBets?.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white dark:bg-gray-700 text-blue-500 dark:text-white text-xs rounded-full">
                {placedBets?.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl">
        {!activeBets?.length ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {activeTab === 'unplaced'
                ? "You don't have any unplaced bets at the moment."
                : "You haven't placed any bets yet."}
            </p>
            {activeTab === 'placed' && unplacedBets?.length > 0 && (
              <button 
                className="mt-4 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                onClick={() => setActiveTab('unplaced')}
              >
                View Available Bets
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {activeBets.map((bet) => (
              <Bet key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(UpcomingBetsPage);