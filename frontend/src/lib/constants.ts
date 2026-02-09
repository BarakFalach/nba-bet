// Re-export season constants for convenience
export { CURRENT_SEASON, LEGACY_SEASON, AVAILABLE_SEASONS, SEASON_CONFIG } from '@/hooks/useSeason';

export enum QueryKeys {
  BETS = 'bets',
  LEADERBOARD = 'leaderBoard',
  BET_COMPLETE = 'betComplete',
  OVERALL_BET_COMPARE = 'overallBetCompare',
  FINALS_BET = 'finalsBet',
  FINALS_MVP_BET = 'finalsMvpBet',
}