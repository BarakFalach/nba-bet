import { nbaTeams } from "../types/events";

// NBA team primary colors for UI elements
export const nbaTeamColors: Record<keyof typeof nbaTeams, string> = {
  Hawks: '#E03A3E',
  Celtics: '#007A33',
  Nets: '#000000',
  Hornets: '#1D1160',
  Bulls: '#CE1141',
  Cavaliers: '#860038',
  Mavericks: '#00538C',
  Nuggets: '#0E2240',
  Pistons: '#C8102E',
  Warriors: '#1D428A',
  Rockets: '#CE1141',
  Pacers: '#002D62',
  Clippers: '#C8102E',
  Lakers: '#552583',
  Grizzlies: '#5D76A9',
  Heat: '#98002E',
  Bucks: '#00471B',
  Timberwolves: '#0C2340',
  Pelicans: '#0C2340',
  Knicks: '#006BB6',
  Thunder: '#007AC1',
  Magic: '#0077C0',
  Sixers: '#006BB6',
  Suns: '#1D1160',
  TrailBlazers: '#E03A3E',
  Kings: '#5A2D81',
  Spurs: '#C4CED4',
  Raptors: '#CE1141',
  Jazz: '#002B5C',
  Wizards: '#002B5C'
};

// For dark mode or secondary colors
export const nbaTeamSecondaryColors: Record<keyof typeof nbaTeams, string> = {
  Hawks: '#C1D32F',
  Celtics: '#BA9653',
  Nets: '#FFFFFF',
  Hornets: '#00788C',
  Bulls: '#000000',
  Cavaliers: '#041E42',
  Mavericks: '#002B5E',
  Nuggets: '#FEC524',
  Pistons: '#1D42BA',
  Warriors: '#FFC72C',
  Rockets: '#000000',
  Pacers: '#FDBB30',
  Clippers: '#1D428A',
  Lakers: '#FDB927',
  Grizzlies: '#12173F',
  Heat: '#F9A01B',
  Bucks: '#EEE1C6',
  Timberwolves: '#236192',
  Pelicans: '#C8102E',
  Knicks: '#F58426',
  Thunder: '#EF3B24',
  Magic: '#000000',
  Sixers: '#ED174C',
  Suns: '#E56020',
  TrailBlazers: '#000000',
  Kings: '#63727A',
  Spurs: '#000000',
  Raptors: '#000000',
  Jazz: '#00471B',
  Wizards: '#E31837'
};

// Utility function to get team color with proper contrast for text
export function getTeamColorWithContrast(teamName: string, isDarkMode: boolean = false): { backgroundColor: string, textColor: string } {
  // Get the team's main color, default to a neutral gray if not found
  const team = teamName as keyof typeof nbaTeams;
  const backgroundColor = nbaTeamColors[team] || '#6B7280';
  
  // Calculate relative luminance (simplified) to determine if we need dark or light text
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Calculate relative luminance using the formula from WCAG 2.0
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  
  // Choose text color based on luminance (for contrast)
  const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';
  
  // For dark mode, we might want to adjust the background to be slightly lighter
  const adjustedBgColor = isDarkMode 
    ? lightenDarkenColor(backgroundColor, 20) // Lighten for dark mode
    : backgroundColor;
  
  return {
    backgroundColor: adjustedBgColor,
    textColor
  };
}

// Helper function to lighten or darken a color
function lightenDarkenColor(color: string, amount: number): string {
  let usePound = false;
  
  if (color[0] === '#') {
    color = color.slice(1);
    usePound = true;
  }
  
  const num = parseInt(color, 16);
  
  let r = (num >> 16) + amount;
  r = Math.max(Math.min(255, r), 0);
  
  let g = ((num >> 8) & 0x00FF) + amount;
  g = Math.max(Math.min(255, g), 0);
  
  let b = (num & 0x0000FF) + amount;
  b = Math.max(Math.min(255, b), 0);
  
  return (usePound ? '#' : '') + 
    String("000000" + (b | (g << 8) | (r << 16)).toString(16)).slice(-6);
}