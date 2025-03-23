'use client';

import Image from 'next/image'; // Import Next.js Image component
import BOSLogo from '@/images/BOS.png'; // Boston Celtics logo
import LALLogo from '@/images/LAL.png'; // Los Angeles Lakers logo

export default function Bet() {
  // Mock data (dynamic structure)
  const betData = {
    teams: {
      home: {
        name: 'LAL',
        logo: LALLogo,
      },
      away: {
        name: 'BOS',
        logo: BOSLogo,
      },
    },
    time: '7:30 PM',
    round: 'Round 1',
    date: 'March 25, 2025',
    userBet: 'Lakers to Win', // Example user bet
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg max-w-md w-full">
      <div className="flex items-center justify-between w-full mb-4">
        {/* Team Logos and Names */}
        <div className="flex flex-col items-center">
          <span className="text-gray-900 dark:text-gray-100 font-semibold mb-2">
            {betData.teams.home.name}
          </span>
          <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <Image
              src={betData.teams.home.logo}
              alt={`${betData.teams.home.name} logo`}
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </div>
        {/* Match Info */}
        <div className="text-center mb-4">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Time:</strong> {betData.time}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Round:</strong> {betData.round}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Date:</strong> {betData.date}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-900 dark:text-gray-100 font-semibold mb-2">
            {betData.teams.away.name}
          </span>
          <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <Image
              src={betData.teams.away.logo}
              alt={`${betData.teams.away.name} logo`}
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* User Bet
      <div className="text-center">
        <p className="text-blue-600 dark:text-blue-400 font-semibold">
          Your Bet: {betData.userBet}
        </p>
      </div> */}
    </div>
  );
}
