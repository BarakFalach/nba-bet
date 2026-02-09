'use client';

import { useSeason, CURRENT_SEASON } from '@/hooks/useSeason';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';

export function SeasonSelector() {
  const { season, setSeason, availableSeasons } = useSeason();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeasonSelect = (selectedSeason: number) => {
    setSeason(selectedSeason);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
      >
        <span>{season} Playoffs</span>
        {season === CURRENT_SEASON && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 rounded">Current</span>
        )}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
          {availableSeasons.map((s) => (
            <button
              key={s}
              onClick={() => handleSeasonSelect(s)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-600 transition-colors flex items-center justify-between ${
                season === s ? 'bg-gray-600 text-blue-400' : 'text-gray-200'
              }`}
            >
              <span>{s} Playoffs</span>
              {s === CURRENT_SEASON && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">Current</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SeasonSelector;
