

export interface Event {
  eventType: EventType | null; 
  id: string;
  parseEvent: string | null; 
  round: roundType | null; 
  startTime: string; 
  status: number; // what is this? 
  team1: string; 
  team1Score: number;
  team2: string; 
  team2Score: number; 
}

export enum nbaTeams {
  Hawks = 'Hawks',
  Celtics = 'Celtics',
  Nets = 'Nets',
  Hornets = 'Hornets',
  Bulls = 'Bulls',
  Cavaliers = 'Cavaliers',
  Mavericks = 'Mavericks',
  Nuggets = 'Nuggets',
  Pistons = 'Pistons',
  Warriors = 'Warriors',
  Rockets = 'Rockets',
  Pacers = 'Pacers',
  Clippers = 'Clippers',
  Lakers = 'Lakers',
  Grizzlies = 'Grizzlies',
  Heat = 'Heat',
  Bucks = 'Bucks',
  Timberwolves = 'Timberwolves',
  Pelicans = 'Pelicans',
  Knicks = 'Knicks',
  Thunder = 'Thunder',
  Magic = 'Magic',
  Sixers = 'Sixers',
  Suns = 'Suns',
  TrailBlazers = 'TrailBlazers',
  Kings = 'Kings',
  Spurs = 'Spurs',
  Raptors = 'Raptors',
  Jazz = 'Jazz',
  Wizards = 'Wizards',
}

export type EventType = 'series' | 'game' | 'playin';
export type roundType = 'firstRound' | 'secondRound' | 'conference' | 'finals' | 'playin';

export interface PredictionResult {
  correctWinnerSeries?: number;
  correctWinnerExactGames?: number;
  correctWinnerPoints?: number; 
  correctScoreDifferenceExact?: number;
  correctScoreDifferenceClosest?: number;
}

export const PredictionResultPerType: Record<roundType, PredictionResult> = {
  playin: {
    correctWinnerPoints: 2,
    correctScoreDifferenceExact: 4,
    correctScoreDifferenceClosest: 3,
  },
  firstRound: {
    correctWinnerSeries: 4,
    correctWinnerExactGames: 6,
  },
  secondRound: {
    correctWinnerSeries: 8,
    correctWinnerExactGames: 12,
  },
  conference: {
    correctWinnerSeries: 8,
    correctWinnerExactGames: 12,
    correctWinnerPoints: 2,
    correctScoreDifferenceExact: 4,
    correctScoreDifferenceClosest: 3,
  },
  finals: {
    correctWinnerSeries: 12,
    correctWinnerExactGames: 16,
    correctWinnerPoints: 4,
    correctScoreDifferenceExact: 8,
    correctScoreDifferenceClosest: 6,
  },

}