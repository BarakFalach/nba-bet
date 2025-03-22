'use client';

import { useRouter } from 'next/navigation';

export default function MainPage() {
  const router = useRouter();

  const handleGoToUpcomingBets = () => {
    router.push('/upcomingBets');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-white dark:bg-black">
      <div className="w-full max-w-2xl text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to the Betting Hub
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
          Track, predict, and stay ahead with your upcoming bets.
        </p>

        <button
          onClick={handleGoToUpcomingBets}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-all duration-200 shadow-md"
        >
          Go to Upcoming Bets
        </button>
      </div>
    </div>
  );
}
