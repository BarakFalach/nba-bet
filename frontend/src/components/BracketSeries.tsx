'use client';

import React from 'react';
import Logo from './Logo';
import { Event } from '../types/events';
import { nbaTeamColors } from '@/lib/teamColors';
import { getTeamAbbr } from '@/lib/teamConferences';

interface BracketCellProps {
  series: Event | null;
}

export default function BracketCell({ series }: BracketCellProps) {
  if (!series || (!series.team1 && !series.team2)) {
    return <PlaceholderCell />;
  }

  const { team1, team2, team1Score, team2Score, status } = series;
  const isResolved = status === 3;
  const isLive = status === 2;
  const team1Wins = isResolved && team1Score > team2Score;
  const team2Wins = isResolved && team2Score > team1Score;

  return (
    <div className="relative w-[100px] rounded-md bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
      {isLive && (
        <span
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse z-10"
          title="Live"
        />
      )}
      <TeamRow
        team={team1}
        score={team1Score}
        isWinner={team1Wins}
        isLoser={team2Wins}
        isLive={isLive}
      />
      <div className="h-px bg-gray-200 dark:bg-gray-700" />
      <TeamRow
        team={team2}
        score={team2Score}
        isWinner={team2Wins}
        isLoser={team1Wins}
        isLive={isLive}
      />
    </div>
  );
}

function TeamRow({
  team,
  score,
  isWinner,
  isLoser,
  isLive,
}: {
  team: string;
  score: number;
  isWinner: boolean;
  isLoser: boolean;
  isLive: boolean;
}) {
  const color = nbaTeamColors[team as keyof typeof nbaTeamColors] || '#6B7280';
  const abbr = getTeamAbbr(team);

  return (
    <div
      className={`flex items-center gap-1 pl-1.5 pr-1.5 py-1 ${
        isLoser ? 'opacity-50' : ''
      }`}
    >
      {/* Team color stripe */}
      <span
        className="w-0.5 h-5 rounded-sm flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        <Logo teamName={team} size="xsmall" />
      </div>
      <span
        className={`text-[11px] flex-1 truncate ${
          isWinner
            ? 'font-bold text-gray-900 dark:text-white'
            : 'text-gray-700 dark:text-gray-200'
        }`}
      >
        {abbr}
      </span>
      <span
        className={`text-[11px] tabular-nums ${
          isWinner
            ? 'font-bold text-gray-900 dark:text-white'
            : isLive
            ? 'font-semibold text-gray-800 dark:text-gray-100'
            : 'text-gray-600 dark:text-gray-300'
        }`}
      >
        {score}
      </span>
    </div>
  );
}

function PlaceholderCell() {
  return (
    <div className="w-[100px] rounded-md bg-gray-50 dark:bg-gray-800/50 ring-1 ring-dashed ring-gray-300 dark:ring-gray-700 overflow-hidden">
      <PlaceholderRow />
      <div className="h-px bg-gray-200 dark:bg-gray-700" />
      <PlaceholderRow />
    </div>
  );
}

function PlaceholderRow() {
  return (
    <div className="flex items-center gap-1 pl-1.5 pr-1.5 py-1">
      <span className="w-0.5 h-5 rounded-sm flex-shrink-0 bg-gray-200 dark:bg-gray-700" />
      <div className="w-4 h-4 flex-shrink-0" />
      <span className="text-[11px] flex-1 text-gray-400 dark:text-gray-500">TBD</span>
      <span className="text-[11px] text-gray-300 dark:text-gray-600">–</span>
    </div>
  );
}
