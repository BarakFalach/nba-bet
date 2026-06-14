export interface LeaderBoardRow {
  email: string;
  name: string;
  score: number;
  finalsBet?: string
  finalsBetResult?: 'correct' | 'incorrect' | null
  finalsMvpBet?: string
  finalsMvpPlayerId?: string
  finalsMvpBetResult?: 'correct' | 'incorrect' | null
}