export interface Event {
  eventType: 'game' | 'practice' | 'tournament' | null; 
  id: string;
  parseEvent: string | null; 
  round: string | null; 
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