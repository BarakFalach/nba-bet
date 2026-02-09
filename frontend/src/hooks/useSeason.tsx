'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Season constants
export const CURRENT_SEASON = 2026;
export const LEGACY_SEASON = 2025; // NULL in DB means 2025
export const AVAILABLE_SEASONS = [2025, 2026];

// Season-specific configuration (deadlines, etc.)
export const SEASON_CONFIG: Record<number, {
  finalsDeadline: string;
  mvpDeadline: string;
  label: string;
}> = {
  2025: {
    finalsDeadline: '2025-04-19T20:00:00Z',
    mvpDeadline: '2025-06-30T20:00:00Z',
    label: '2025 Playoffs',
  },
  2026: {
    finalsDeadline: '2026-04-18T20:00:00Z',
    mvpDeadline: '2026-06-29T20:00:00Z',
    label: '2026 Playoffs',
  },
};

interface SeasonContextType {
  season: number;
  setSeason: (season: number) => void;
  availableSeasons: number[];
  isCurrentSeason: boolean;
  seasonConfig: typeof SEASON_CONFIG[number];
}

const SeasonContext = createContext<SeasonContextType | null>(null);

export const SeasonProvider = ({ children }: { children: ReactNode }) => {
  const [season, setSeason] = useState<number>(CURRENT_SEASON);

  const value: SeasonContextType = {
    season,
    setSeason,
    availableSeasons: AVAILABLE_SEASONS,
    isCurrentSeason: season === CURRENT_SEASON,
    seasonConfig: SEASON_CONFIG[season] || SEASON_CONFIG[CURRENT_SEASON],
  };

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};

// Helper function to convert season to DB value (NULL for 2025, number for others)
export const seasonToDbValue = (season: number): number | null => {
  return season === LEGACY_SEASON ? null : season;
};

// Helper function to convert DB value to season (NULL means 2025)
export const dbValueToSeason = (dbValue: number | null): number => {
  return dbValue === null ? LEGACY_SEASON : dbValue;
};
