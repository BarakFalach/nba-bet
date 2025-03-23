'use client';

import Bet from '@/components/Bet'; // Adjust the import path as needed

export default function UpcomingBetsPage() {
  return (
    <div className="flex flex-col items-center justify-top min-h-screen px-4 bg-white dark:bg-black">
      <h1 className="text-3xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
        Upcoming Bets
      </h1>
      <div className="flex flex-col items-center justify-center w-full max-w-2xl space-y-4">
      <Bet />
      <Bet />
      <Bet />

      </div>
    </div>
  );
}