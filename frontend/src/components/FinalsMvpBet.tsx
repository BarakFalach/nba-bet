'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useFinalsMvpBet } from '@/hooks/useFinalsMvpBet';
import Player from './Player';

interface FinalsMvpBetProps {
  onClose: () => void;
}

export default function FinalsMvpBet({ onClose }: FinalsMvpBetProps) {
  const { finalsMvpBet, finalsMvpPlayer, isLoading, isBetOpen, placeBet, isPlacing, error } = useFinalsMvpBet();
  const [playerName, setPlayerName] = useState('');
  const [isVisible, setIsVisible] = useState(false);
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

  // Set initial input value based on existing bet
  useEffect(() => {
    if (finalsMvpPlayer) {
      setPlayerName(finalsMvpPlayer);
    }
  }, [finalsMvpPlayer]);

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

  const handlePlaceMvpBet = async () => {
    if (!playerName.trim()) {
      setFeedbackMessage({
        type: 'error',
        message: 'Please enter a player name to place your bet.'
      });
      return;
    }

    try {
      setFeedbackMessage({
        type: 'info',
        message: 'Placing your bet...'
      });

      await placeBet(playerName.trim());
      
      setFeedbackMessage({
        type: 'success',
        message: 'Finals MVP bet placed successfully!'
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
      console.error('Error placing Finals MVP bet:', err);
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
            Finals MVP Prediction
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
                  Enter the name of the player you think will win the NBA Finals MVP this season.
                </p>
                {finalsMvpBet ? (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-yellow-700 dark:text-yellow-200 text-sm">
                    <strong>Note:</strong> You already have a Finals MVP prediction. 
                    Submitting a new one will replace your current pick.
                  </div>
                ) : null}
                {!isBetOpen && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded text-red-700 dark:text-red-200 text-sm">
                    <strong>Betting is closed.</strong> The deadline for placing Finals MVP bets has passed.
                  </div>
                )}
              </div>

              {/* Player name input */}
              <div className="mb-4">
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  id="playerName"
                  placeholder="Enter player name (e.g., LeBron James)"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  disabled={!isBetOpen || isPlacing}
                  className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            disabled:bg-gray-100 disabled:dark:bg-gray-700 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use the player full name for best results.
                </p>
              </div>

              {/* Current selection display */}
              {finalsMvpPlayer && (
                <div className="flex items-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <Player showName={false} size="large" playerId={finalsMvpBet?.playerId} playerName={finalsMvpBet?.playerName} />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your current prediction
                      </p>
                      <p className="font-bold text-lg text-blue-600 dark:text-blue-300">
                        {finalsMvpPlayer}
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
                  onClick={handlePlaceMvpBet}
                  disabled={!playerName.trim() || isPlacing || !isBetOpen}
                  className={`px-4 py-3 sm:py-2 text-white rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto ${
                    playerName.trim() && !isPlacing && isBetOpen
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
                      <span>{finalsMvpBet ? 'Update' : 'Place'} Finals MVP Bet</span>
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