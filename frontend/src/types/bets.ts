import {EventType} from './events';

export interface Bet {
  calcFunc: string; 
  closeTime: string; 
  created_at: string;
  eventId: string;
  eventType: EventType | null;
  id: string; 
  pointsGained: number | null; 
  pointsGainedWinMargin: number | null;
  result: string | null; 
  userId: number; 
  winMargin: number | null; 
  winnerTeam: string | null;
}