import React from 'react';
import { EnhancedBet } from '@/hooks/useBets';
import { PredictionResultPerType } from '../types/events';

interface EventTypeProps {
  bet: EnhancedBet;
}

const EventType: React.FC<EventTypeProps> = ({ bet }) => {
  // Extract the event type and round
  const round = bet?.events?.round || 'firstRound';
  const eventType = bet?.events?.eventType || 'game';
  
  // Determine style based on round
  let bgColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  let label = '';
  
  switch (round?.toLowerCase()) {
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

  // Get event type indicator
  let eventTypeIndicator = '';
  if (eventType === 'game') {
    eventTypeIndicator = 'G';
  } else if (eventType === 'series') {
    eventTypeIndicator = 'S';
  }
  
  // Get scores for this round type
  const scoreData = PredictionResultPerType[round];
  
  // Filter scores based on event type
  let scores: number[] = [];
  if (scoreData) {
    if (eventType === 'series') {
      scores = [
        scoreData.correctWinnerSeries,
        scoreData.correctWinnerExactGames,
      ].filter(score => score !== undefined) as number[];
    } else { // 'game', 'playin', or default
      scores = [
        scoreData.correctWinnerPoints,
        scoreData.correctScoreDifferenceExact,
        scoreData.correctScoreDifferenceClosest
      ].filter(score => score !== undefined) as number[];
    }
  }

  return (
    <div className={`inline-flex items-center rounded-full text-xs font-medium shadow-sm ${bgColor}`}>
      <div className="px-2 py-1 border-r border-white/20 dark:border-black/20">
        {label}
        {eventTypeIndicator && (
          <span className="ml-1 px-1 py-0.5 bg-white/30 dark:bg-black/20 rounded-full text-xs">
            {eventTypeIndicator}
          </span>
        )}
      </div>
      {scores.length > 0 && (
        <div className="px-2 py-1 flex items-center space-x-1">
          {scores.map((score, index) => (
            <span 
              key={index}
              className="font-bold"
            >
              {index > 0 ? '•' : ''} {score}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventType;