'use client';

import Bet from '@/components/Bet'; 
import { useBets } from '@/hooks/useBets';
import { withAuth } from '@/lib/withAuth';

function UpcomingBetsPage() {
  const {isLoading, unplacedBets: bets} = useBets();

  if (isLoading) {
    return <p>Loading events...</p>;
  }

  if (!bets?.length) {
    return <p>No events found.</p>;
  }


  return (
    <div className="flex flex-col items-center justify-top min-h-screen px-4 bg-white dark:bg-black">
      <h1 className="text-3xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
      Unplaced Bets
      </h1>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl space-y-4">
      
      <div className="space-y-4">
      {bets?.map((bet) => (
        <Bet
          key={bet.id}
          bet={bet}
          event={bet.events}
          />
      ))}
    </div>

      </div>
    </div>
  );
}

export default withAuth(UpcomingBetsPage)