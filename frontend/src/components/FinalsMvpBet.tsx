'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import Logo from './Logo';
import Player from './Player';
import {
  useFinalsMvpBet,
  useFinalsMvpTeamRoster,
  FinalsPlayer,
} from '@/hooks/useFinalsMvpBet';
import { useSeason } from '@/hooks/useSeason';

interface FinalsMvpBetProps {
  onClose: () => void;
}

type Step = 'team' | 'player';

export default function FinalsMvpBet({ onClose }: FinalsMvpBetProps) {
  const {
    finalsMvpBet,
    finalsMvpPlayer,
    finalsTeams,
    isLoading,
    isBetOpen,
    betStatus,
    placeBet,
    isPlacing,
    error,
  } = useFinalsMvpBet();
  const { season } = useSeason();

  const [step, setStep] = useState<Step>('team');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<FinalsPlayer | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const { data: rosterData, isLoading: isRosterLoading } = useFinalsMvpTeamRoster(
    step === 'player' ? selectedTeam : null,
  );

  const filteredPlayers = (rosterData?.players ?? []).filter((player) =>
    player.playerName.toLowerCase().includes(playerSearch.toLowerCase()),
  );

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  useEffect(() => {
    if (finalsMvpBet) {
      setSelectedPlayer({
        playerId: finalsMvpBet.playerId,
        playerName: finalsMvpBet.playerName,
      });
    }
  }, [finalsMvpBet]);

  useEffect(() => {
    const existingBet = finalsMvpBet;
    const teams = finalsTeams;
    if (!existingBet || !teams) return;

    let cancelled = false;

    async function resolveExistingBetTeam() {
      for (const team of [teams?.team1, teams?.team2]) {
        const response = await fetch(
          `/api/finalsMvpBet?teamName=${encodeURIComponent(team!)}&season=${season}`,
        );
        if (!response.ok) continue;

        const { players } = (await response.json()) as { players: FinalsPlayer[] };
        const match = players.find((player) => player.playerId === existingBet?.playerId);
        if (match && !cancelled) {
          setSelectedTeam(team ?? null);
          setSelectedPlayer(match);
          setStep('player');
          return;
        }
      }
    }

    resolveExistingBetTeam();
    return () => {
      cancelled = true;
    };
  }, [finalsMvpBet, finalsTeams, season]);

  useEffect(() => {
    setIsVisible(true);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSelectTeam = (team: string) => {
    setSelectedTeam(team);
    setSelectedPlayer(null);
    setPlayerSearch('');
    setStep('player');
  };

  const handleBackToTeams = () => {
    setStep('team');
    setPlayerSearch('');
  };

  const handlePlaceMvpBet = async () => {
    if (!selectedPlayer) {
      setFeedbackMessage({
        type: 'error',
        message: 'Please select a player to place your bet.',
      });
      return;
    }

    try {
      setFeedbackMessage({
        type: 'info',
        message: 'Placing your bet...',
      });

      await placeBet(selectedPlayer);

      setFeedbackMessage({
        type: 'success',
        message: 'Finals MVP bet placed successfully!',
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        message: error?.message || 'Failed to place bet. Please try again.',
      });
      console.error('Error placing Finals MVP bet:', err);
    }
  };

  const finalsTeamList = finalsTeams ? [finalsTeams.team1, finalsTeams.team2] : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 'player' && (
              <button
                onClick={handleBackToTeams}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Back to team selection"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Finals MVP Prediction
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {feedbackMessage && (
          <div
            className={`p-3 flex items-center justify-between animate-slideDown
              ${
                feedbackMessage.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : feedbackMessage.type === 'error'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
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
            <button onClick={() => setFeedbackMessage(null)} className="p-1">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {step === 'team'
                    ? 'Select the Finals team your MVP pick plays for.'
                    : `Select a player from the ${selectedTeam} roster.`}
                </p>
                {finalsMvpBet ? (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-yellow-700 dark:text-yellow-200 text-sm">
                    <strong>Note:</strong> You already have a Finals MVP prediction.
                    Submitting a new one will replace your current pick.
                  </div>
                ) : null}
                {betStatus === 'pending_finals' && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-yellow-700 dark:text-yellow-200 text-sm">
                    <strong>Not open yet.</strong> The Finals MVP bet opens once both
                    conference finals are decided.
                  </div>
                )}
                {betStatus === 'closed' && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded text-red-700 dark:text-red-200 text-sm">
                    <strong>Betting is closed.</strong> The deadline for placing Finals MVP
                    bets has passed.
                  </div>
                )}
              </div>

              {step === 'team' && (
                <>
                  {finalsTeamList.length === 2 ? (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {finalsTeamList.map((team) => (
                        <button
                          key={team}
                          onClick={() => handleSelectTeam(team)}
                          disabled={!isBetOpen || isPlacing}
                          className={`flex flex-col items-center p-4 rounded-lg transition-all duration-200 ${
                            selectedTeam === team
                              ? 'bg-blue-100 dark:bg-blue-900/40 shadow-md'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <Logo teamName={team} size="medium" />
                          <span className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                            {team}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-300">
                      Finals teams are not available yet.
                    </div>
                  )}
                </>
              )}

              {step === 'player' && selectedTeam && (
                <>
                  <div className="flex items-center justify-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Logo teamName={selectedTeam} size="small" />
                    <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">
                      {selectedTeam}
                    </span>
                  </div>

                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Filter players..."
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      disabled={!isBetOpen || isPlacing}
                      className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed"
                    />
                  </div>

                  {isRosterLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto mb-4 pr-1 space-y-2">
                      {filteredPlayers.length > 0 ? (
                        filteredPlayers.map((player) => (
                          <button
                            key={player.playerId}
                            onClick={() => setSelectedPlayer(player)}
                            disabled={!isBetOpen || isPlacing}
                            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                              selectedPlayer?.playerId === player.playerId
                                ? 'bg-blue-100 dark:bg-blue-900/40 shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Player
                              playerId={player.playerId}
                              playerName={player.playerName}
                              size="small"
                            />
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No players found for this team.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {finalsMvpPlayer && step === 'team' && (
                <div className="flex items-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm">
                  <Player
                    playerId={finalsMvpBet?.playerId}
                    playerName={finalsMvpPlayer}
                    size="medium"
                  />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your current prediction
                    </p>
                  </div>
                </div>
              )}

              {selectedPlayer && step === 'player' && (
                <div className="flex items-center mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm">
                  <Player
                    playerId={selectedPlayer.playerId}
                    playerName={selectedPlayer.playerName}
                    size="medium"
                  />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your selection</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-3 sm:py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 w-full sm:w-auto"
                  disabled={isPlacing}
                >
                  Cancel
                </button>
                {step === 'player' && (
                  <button
                    onClick={handlePlaceMvpBet}
                    disabled={!selectedPlayer || isPlacing || !isBetOpen}
                    className={`px-4 py-3 sm:py-2 text-white rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto ${
                      selectedPlayer && !isPlacing && isBetOpen
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
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
