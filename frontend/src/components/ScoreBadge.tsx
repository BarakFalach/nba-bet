import React from 'react';
import { roundType, PredictionResultPerType } from '../types/events';

interface ScoreBadgeProps {
  round: string;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ round }) => {
  // Ensure we have a valid round type
  const normalizedRound = round?.toLowerCase() as roundType || 'firstRound';
  
  // Get scores for this round type
  const scoreData = PredictionResultPerType[normalizedRound];
  
  if (!scoreData) return null;
  
  // Extract available scores (filter out undefined values)
  const scores = [
    scoreData.correctWinnerSeries,
    scoreData.correctWinnerExactGames,
    scoreData.correctWinnerPoints,
    scoreData.correctScoreDifferenceExact,
    scoreData.correctScoreDifferenceClosest
  ].filter(score => score !== undefined);
  
  return (
    <div className="inline-flex bg-gray-50 dark:bg-gray-800 rounded px-1.5 py-0.5 shadow-sm">
      {scores.map((score, index) => (
        <div key={index} className="px-1 text-center">
          <span 
            className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium"
          >
            {score}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ScoreBadge;