export interface Bet {
  calcFunc: string; 
  closeTime: string; 
  created_at: string;
  eventId: string;
  eventType: 'playin' | 'firstRound' | 'secondRound' | 'conference' | 'finals'; 
  id: string; 
  pointsGained: number | null; 
  result: string | null; 
  userId: number; 
  winMargin: number | null; 
  winnerTeam: string | null;
}