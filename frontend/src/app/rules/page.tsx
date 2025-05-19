'use client';

import React from 'react';
import { PredictionResultPerType, roundType, PredictionResult } from '../../types/events';

const roundNames: Record<roundType, string> = {
  playin: 'Play-In Tournament',
  firstRound: 'First Round',
  secondRound: 'Second Round',
  conference: 'Conference Finals',
  finals: 'NBA Finals',
};

const ruleDescriptions: Record<keyof PredictionResult, string> = {
  correctWinnerSeries: 'Correct Series Winner',
  correctWinnerExactGames: 'Correct Series Winner + Exact Games',
  correctWinnerPoints: 'Correct Game Winner',
  correctScoreDifferenceExact: 'Exact Point Difference',
  correctScoreDifferenceClosest: 'Closest Point Difference',
};

export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-2">
      <h1 className="text-3xl font-bold dark:text-white mb-6">Betting Rules & Points</h1>
      
      <div className="space-y-6">
        {Object.entries(PredictionResultPerType).map(([round, rules]) => (
          <div key={round} className="bg-white/80 dark:bg-gray-800 rounded-xl p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
              {roundNames[round as roundType]}
            </h2>
            
            <div className="grid gap-4">
              {Object.entries(rules as PredictionResult).map(([rule, points]) => (
                <div key={rule} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50/80 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-200 break-words">
                    {ruleDescriptions[rule as keyof PredictionResult]}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
                    {points} points
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white/80 dark:bg-gray-800 rounded-xl p-6 shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">How Points Work</h2>
        <div className="space-y-4 text-gray-700 dark:text-gray-200">
          <p>
            • For series bets, you can earn points for predicting the winner and the number of games.
          </p>
          <p>
            • For individual games, you can earn points for predicting the winner and the point difference.
          </p>
          <p>
            • The closer your prediction is to the actual result, the more points you earn.
          </p>
          <p>
            • Points are awarded based on the round of the playoffs, with higher stakes in later rounds.
          </p>
        </div>
      </div>
    </div>
  );
} 