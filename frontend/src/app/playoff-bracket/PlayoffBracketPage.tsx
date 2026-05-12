'use client';

import React from 'react';
import { usePlayoffBracket } from '@/hooks/usePlayoffBracket';
import { useSeason } from '@/hooks/useSeason';
import BracketCell from '@/components/BracketSeries';
import PageLoader from '@/components/PageLoader';
import { Event } from '../../types/events';

// NBA bracket shape: 4 first-round series per conference, 2 semis, 1 conf final, then finals.
const EXPECTED = {
  firstRound: 4,
  secondRound: 2,
  conference: 1,
  finals: 1,
} as const;

// Min height of each column so cells in later rounds vertically center between feeders.
// 4 cells * ~46px = ~184; we give extra room so spacing is generous.
const COLUMN_MIN_HEIGHT = 420;

function pad(list: Event[], count: number): (Event | null)[] {
  const out: (Event | null)[] = [...list];
  while (out.length < count) out.push(null);
  return out.slice(0, count);
}

export default function PlayoffBracketPage() {
  const { season } = useSeason();
  const { bracket, isLoading } = usePlayoffBracket();

  if (isLoading) return <PageLoader />;

  const r1East = pad(bracket.firstRound.East, EXPECTED.firstRound);
  const sfEast = pad(bracket.secondRound.East, EXPECTED.secondRound);
  const cfEast = pad(bracket.conference.East, EXPECTED.conference);
  const finals = pad(bracket.finals, EXPECTED.finals);
  const cfWest = pad(bracket.conference.West, EXPECTED.conference);
  const sfWest = pad(bracket.secondRound.West, EXPECTED.secondRound);
  const r1West = pad(bracket.firstRound.West, EXPECTED.firstRound);

  return (
    <div className="px-3 pb-8">
      <div className="max-w-md mx-auto mb-3 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Playoffs {season}
        </h1>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Scroll to see full bracket →
        </span>
      </div>

      {/* Conference labels */}
      <div className="overflow-x-auto -mx-3 px-3">
        <div className="flex gap-1.5 min-w-max">
          <ConferenceLabel side="East" colsCount={3} />
          <div className="w-[100px] text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 py-1">
            Finals
          </div>
          <ConferenceLabel side="West" colsCount={3} />
        </div>

        {/* Round headers */}
        <div className="flex gap-1.5 min-w-max mt-1">
          <ColHeader label="R1" />
          <ColHeader label="SF" />
          <ColHeader label="CF" />
          <ColHeader label="F" emphasis />
          <ColHeader label="CF" />
          <ColHeader label="SF" />
          <ColHeader label="R1" />
        </div>

        {/* Bracket body */}
        <div className="flex gap-1.5 min-w-max mt-1">
          <BracketColumn cells={r1East} />
          <BracketColumn cells={sfEast} />
          <BracketColumn cells={cfEast} />
          <BracketColumn cells={finals} emphasis />
          <BracketColumn cells={cfWest} />
          <BracketColumn cells={sfWest} />
          <BracketColumn cells={r1West} />
        </div>
      </div>

      <div className="max-w-md mx-auto mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Live
        </span>
        <span className="flex items-center gap-1">
          <span className="font-bold text-gray-900 dark:text-white">Bold</span>
          = winner
        </span>
        <span>Number = series wins</span>
      </div>
    </div>
  );
}

function ConferenceLabel({ side, colsCount }: { side: 'East' | 'West'; colsCount: number }) {
  // Spans across `colsCount` columns of 100px each + gaps of 6px.
  const width = colsCount * 100 + (colsCount - 1) * 6;
  return (
    <div
      style={{ width }}
      className="text-center text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 py-1"
    >
      {side === 'East' ? 'Eastern Conference' : 'Western Conference'}
    </div>
  );
}

function ColHeader({ label, emphasis }: { label: string; emphasis?: boolean }) {
  return (
    <div
      className={`w-[100px] text-center text-[11px] font-bold ${
        emphasis
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-gray-600 dark:text-gray-300'
      }`}
    >
      {label}
    </div>
  );
}

function BracketColumn({
  cells,
  emphasis,
}: {
  cells: (Event | null)[];
  emphasis?: boolean;
}) {
  return (
    <div
      className="flex flex-col justify-around items-center"
      style={{ minHeight: COLUMN_MIN_HEIGHT }}
    >
      {cells.map((c, idx) => (
        <div key={c?.id || `empty-${idx}`} className={emphasis ? 'ring-2 ring-amber-400 dark:ring-amber-500 rounded-md' : ''}>
          <BracketCell series={c} />
        </div>
      ))}
    </div>
  );
}
