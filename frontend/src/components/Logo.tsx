import Image from 'next/image';

import { nbaTeams } from '../types/events';
// Dynamically import all team logosnab
import hawks from '../lib/icons/hawks.png';
import celtics from '../lib/icons/celtics.png';
import nets from '../lib/icons/nets.png';
import hornets from '../lib/icons/hornets.png';
import bulls from '../lib/icons/bulls.png';
import cavaliers from '../lib/icons/cavaliers.png';
import mavericks from '../lib/icons/mavericks.png';
import nuggets from '../lib/icons/nuggets.png';
import pistons from '../lib/icons/pistons.png'; 
import warriors from '../lib/icons/warriors.png';
import rockets from '../lib/icons/rockets.png';
import pacers from '../lib/icons/pacers.png';
import clippers from '../lib/icons/clippers.png';
import lakers from '../lib/icons/lakers.png';
import grizzlies from '../lib/icons/grizzlies.png';
import heat from '../lib/icons/heat.png';
import bucks from '../lib/icons/bucks.png';
import timberwolves from '../lib/icons/timberwolves.png';
import pelicans from '../lib/icons/pelicans.png';
import knicks from '../lib/icons/knicks.png';
import thunder from '../lib/icons/thunder.png';
import magic from '../lib/icons/magic.png';
import sixers from '../lib/icons/76ers.png';
import suns from '../lib/icons/suns.png';
import blazers from '../lib/icons/trailBlazers.png';
import kings from '../lib/icons/kings.png';
import spurs from '../lib/icons/spurs.png';
import raptors from '../lib/icons/raptors.png';
import jazz from '../lib/icons/jazz.png';
import wizards from '../lib/icons/wizards.png';
import nbaLogo from '../lib/icons/_NBA_logo.png';




const teamLogos: Record<nbaTeams, any> = {
  [nbaTeams.Hawks]: hawks,
  [nbaTeams.Celtics]: celtics,
  [nbaTeams.Nets]: nets,
  [nbaTeams.Hornets]: hornets,  
  [nbaTeams.Bulls]: bulls,
  [nbaTeams.Cavaliers]: cavaliers,
  [nbaTeams.Mavericks]: mavericks,
  [nbaTeams.Nuggets]: nuggets,
  [nbaTeams.Pistons]: pistons,
  [nbaTeams.Warriors]: warriors,
  [nbaTeams.Rockets]: rockets,
  [nbaTeams.Pacers]: pacers,
  [nbaTeams.Clippers]: clippers,
  [nbaTeams.Lakers]: lakers,
  [nbaTeams.Grizzlies]: grizzlies,
  [nbaTeams.Heat]: heat,
  [nbaTeams.Bucks]: bucks,
  [nbaTeams.Timberwolves]: timberwolves,
  [nbaTeams.Pelicans]: pelicans,
  [nbaTeams.Knicks]: knicks,
  [nbaTeams.Thunder]: thunder,
  [nbaTeams.Magic]: magic,
  [nbaTeams.Sixers]: sixers,
  [nbaTeams.Suns]: suns,
  [nbaTeams.TrailBlazers]: blazers,
  [nbaTeams.Kings]: kings,
  [nbaTeams.Spurs]: spurs,
  [nbaTeams.Raptors]: raptors,
  [nbaTeams.Jazz]: jazz,
  [nbaTeams.Wizards]: wizards,
  
};

interface LogoProps {
  teamName: string;
  size?: "small" | "medium" | "large";
}

const Logo: React.FC<LogoProps> = ({ teamName, size }) => {
  
  const logo = teamLogos[teamName.replace(/\s+/g, '')]; 
  const height = size === "small" ? 32 : size === "medium" ? 48 : 64;
  const width = size === "small" ? 32 : size === "medium" ? 48 : 64;

  return (
    <div className="w-16 h-16 flex items-center justify-center bg-transparent rounded-full overflow-hidden">
    <Image
      src={logo || nbaLogo}
      alt={`${teamName} logo`}
      width={height}
      height={width}
      className="object-contain"
    />
  </div>
  );
};

export default Logo;