'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';
import { nbaTeams } from '../types/events';

interface FinalsBetProps {
  onClose: () => void;
  initialSelection?: string;
}

export default function FinalsBet({
  onClose,
  initialSelection,
}: FinalsBetProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(
    initialSelection || null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Animation effect
  useEffect(() => {
    setIsVisible(true);

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Filter teams based on search query
  const filteredTeams = Object.values(nbaTeams).filter((team) =>
    team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaceFinalsBet = () => {
    if (!selectedTeam) {
      alert('Please select a team to place your bet.');
      return;
    }

    // TODO: Implement finals bet placement logic
    // This is where you'll add your implementation

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header with close button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Finals Champion Prediction
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-5">
            Select the team you think will win the NBA Finals this season. This
            bet cannot be changed once submitted.
          </p>

          {/* Search box */}
          <div className="relative mb-5">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Team grid with scrollable area */}
          <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto mb-5 pr-1">
            {filteredTeams.map((team) => (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                className={`flex flex-col items-center p-3 rounded-lg transition-transform duration-200 ${
                  selectedTeam === team
                    ? 'bg-blue-100 dark:bg-blue-900 scale-90' // Squeeze effect for selected team
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="relative w-16 h-16">
                  <Logo teamName={team} size="small" />
                  {selectedTeam === team && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
                      <CheckIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <span className="mt-2 text-sm font-medium text-center text-gray-800 dark:text-gray-200">
                  {team}
                </span>
              </button>
            ))}
          </div>
          {/* Selected team display */}
          {selectedTeam && (
            <div className="flex items-center justify-center mb-5 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Logo teamName={selectedTeam} size="medium" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your prediction
                  </p>
                  <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {selectedTeam}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceFinalsBet}
              disabled={!selectedTeam}
              className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${
                selectedTeam
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-400 cursor-not-allowed'
              }`}
            >
              <CheckIcon className="h-5 w-5" />
              Place Finals Bet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
