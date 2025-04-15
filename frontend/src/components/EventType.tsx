import React from 'react';
import { EnhancedBet } from '@/hooks/useBets';

interface EventTypeProps {
  bet: EnhancedBet;
}

const EventType: React.FC<EventTypeProps> = ({ bet }) => {
  // Extract the event type
  const eventType = bet?.events?.eventType || 'firstRound';
  
  // Determine style based on event type
  let bgColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  let label = '';
  
  
  
  switch (eventType?.toLowerCase()) {
    case 'playin':
      label = 'Play-In';
      bgColor = 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      break;
    case 'firstround':
      label = 'First Round';
      bgColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      break;
    case 'secondround':
      label = 'Second Round';
      bgColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      break;
    case 'conference':
      label = 'Conference Finals';
      bgColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      break;
    case 'finals':
      label = 'NBA Finals';
      bgColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      break;
    default:
      label = 'Regular Season';
      bgColor = 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${bgColor}`}>
      {label}
    </div>
  );
};

export default EventType;