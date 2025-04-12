'use client';

import Logo from './Logo';

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

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-lg max-w-md w-full">
      <div className="flex items-center justify-between w-full mb-4">
        {/* Team Logos */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full overflow-hidden bg-transparent">
            <Logo teamName={team1} />
          </div>
        </div>

        {/* Match Info */}
        <div className="text-center mb-4">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Time:</strong> {formattedTime}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Date:</strong> {formattedDate}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 flex items-center justify-center rounded-full overflow-hidden bg-transparent">
            <Logo teamName={team2} />
          </div>
        </div>
      </div>
    </div>
  );
}