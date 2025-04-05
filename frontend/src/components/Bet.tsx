'use client';

import Image from 'next/image'; // Import Next.js Image component
import BOSLogo from '@/images/BOS.png'; // Boston Celtics logo
import LALLogo from '@/images/LAL.png'; // Los Angeles Lakers logo

interface BetProps {
  team1: string;
  team2: string;
  startTime: string | Date; // Accepts a string or Date object
}

export default function Bet(props: BetProps) {
  const { team1, team2, startTime } = props;
  // Format the date and time
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', // e.g., "Mon"
    month: 'short',   // e.g., "Mar"
    day: '2-digit',   // e.g., "25"
    year: 'numeric',  // e.g., "2025"
  })?.format(new Date(startTime));

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // 12-hour format (e.g., "7:30 PM")
  })?.format(new Date(startTime));
  // Mock data (dynamic structure)
  // const betData = {
  //   teams: {
  //     home: {
  //       name: 'LAL',
  //       logo: LALLogo,
  //     },
  //     away: {
  //       name: 'BOS',
  //       logo: BOSLogo,
  //     },
  //   },
  //   time: '7:30 PM',
  //   round: 'Round 1',
  //   date: 'March 25, 2025',
  //   userBet: 'Lakers to Win', // Example user bet
  // };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg max-w-md w-full">
      <div className="flex items-center justify-between w-full mb-4">
        {/* Team Logos and Names */}
        <div className="flex flex-col items-center">
          <span className="text-gray-900 dark:text-gray-100 font-semibold mb-2">
            {team1}
          </span>
          <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <Image
              src={BOSLogo}
              alt={`${team1} logo`}
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
        </div>
        {/* Match Info */}
        <div className="text-center mb-4">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Time:</strong> {(formattedTime)}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            {/* <strong>Round:</strong> {betData.round} */}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Date:</strong> {formattedDate}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-900 dark:text-gray-100 font-semibold mb-2">
            {team2}
          </span>
          <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <Image
              src={LALLogo}
              alt={`${team2} logo`}
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
