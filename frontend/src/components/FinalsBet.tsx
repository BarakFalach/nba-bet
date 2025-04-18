'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Logo from './Logo';
import { nbaTeams } from '../types/events';
import { useFinalsBet } from '@/hooks/useFinalsBet';

interface FinalsBetProps {
  onClose: () => void;
}

export default function FinalsBet({ onClose }: FinalsBetProps) {
  const { finalsBet, isLoading, placeBet, isPlacing, error } = useFinalsBet();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Set initial selection based on existing bet when data loads
  useEffect(() => {
    if (finalsBet?.finalsBet) {
      setSelectedTeam(finalsBet.finalsBet);
    }
  }, [finalsBet]);

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

  const handlePlaceFinalsBet = async () => {
    if (!selectedTeam) {
      setFeedbackMessage({
        type: 'error',
        message: 'Please select a team to place your bet.'
      });
      return;
    }

    try {
      setFeedbackMessage({
        type: 'info',
        message: 'Placing your bet...'
      });

      await placeBet(selectedTeam);
      
      setFeedbackMessage({
        type: 'success',
        message: 'Finals bet placed successfully!'
      });
      
      // Close after short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        message: error?.message || 'Failed to place bet. Please try again.'
      });
      console.error('Error placing finals bet:', err);
    }
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

        {/* Feedback banner */}
        {feedbackMessage && (
          <div 
            className={`p-3 flex items-center justify-between animate-slideDown
              ${feedbackMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                feedbackMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              }
            `}
          >
            <div className="flex items-center">
              {feedbackMessage.type === 'success' ? (
                <CheckIcon className="h-5 w-5 mr-2" />
              ) : feedbackMessage.type === 'error' ? (
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              ) : (
                <div className="h-5 w-5 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
              )}
              <span>{feedbackMessage.message}</span>
            </div>
            <button 
              onClick={() => setFeedbackMessage(null)}
              className="p-1"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-4">
          {/* Loading state */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Description */}
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Select the team you think will win the NBA Finals this season.
                </p>
                {finalsBet ? (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-yellow-700 dark:text-yellow-200 text-sm">
                    <strong>Note:</strong> You already have a Finals prediction. 
                    Submitting a new one will replace your current pick.
                  </div>
                ) : null}
              </div>

              {/* Search box */}
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Team grid with scrollable area */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto mb-4 pr-1">
                {filteredTeams.map((team) => (
                  <button
                    key={team}
                    onClick={() => setSelectedTeam(team)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                      selectedTeam === team
                        ? 'bg-blue-100 dark:bg-blue-900/40 scale-85 animate-squeeze shadow-md' 
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="relative sm:w-16 sm:h-16 items-center justify-center">
                      <Logo teamName={team} size="small" />

                    </div>
                    {/* <span className="mt-2 text-xs sm:text-sm font-medium text-center text-gray-800 dark:text-gray-200 line-clamp-1">
                      {team}
                    </span> */}
                  </button>
                ))}
              </div>

              {/* Selected team display */}
              {selectedTeam && (
                <div className="flex items-center justify-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <Logo teamName={selectedTeam} size="medium" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your prediction
                      </p>
                      <p className="font-bold text-lg text-blue-600 dark:text-blue-300">
                        {selectedTeam}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons - full width on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-3 sm:py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
                  disabled={isPlacing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceFinalsBet}
                  disabled={!selectedTeam || isPlacing}
                  className={`px-4 py-3 sm:py-2 text-white rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto ${
                    selectedTeam && !isPlacing
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-400 cursor-not-allowed'
                  }`}
                >
                  {isPlacing ? (
                    <>
                      <div className="h-5 w-5 border-t-2 border-white rounded-full animate-spin"></div>
                      <span>Placing bet...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      <span>{finalsBet ? 'Update' : 'Place'} Finals Bet</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}