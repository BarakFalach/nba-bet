import Image from 'next/image';

import { nbaTeams } from '../types/events';
import hawks from '../../public/images/logos/hawks.png';
import celtics from '../../public/images/logos/celtics.png';
import nets from '../../public/images/logos/nets.png';
import hornets from '../../public/images/logos/hornets.png';
import bulls from '../../public/images/logos/bulls.png';
import cavaliers from '../../public/images/logos/cavaliers.png';
import mavericks from '../../public/images/logos/mavericks.png';
import nuggets from '../../public/images/logos/nuggets.png';
import pistons from '../../public/images/logos/pistons.png';
import warriors from '../../public/images/logos/warriors.png';
import rockets from '../../public/images/logos/rockets.png';
import pacers from '../../public/images/logos/pacers.png';
import clippers from '../../public/images/logos/clippers.png';
import lakers from '../../public/images/logos/lakers.png';
import grizzlies from '../../public/images/logos/grizzlies.png';
import heat from '../../public/images/logos/heat.png';
import bucks from '../../public/images/logos/bucks.png';
import timberwolves from '../../public/images/logos/timberwolves.png';
import pelicans from '../../public/images/logos/pelicans.png';
import knicks from '../../public/images/logos/knicks.png';
import thunder from '../../public/images/logos/thunder.png';
import magic from '../../public/images/logos/magic.png';
import sixers from '../../public/images/logos/76ers.png';
import suns from '../../public/images/logos/suns.png';
import blazers from '../../public/images/logos/trailBlazers.png';
import kings from '../../public/images/logos/kings.png';
import spurs from '../../public/images/logos/spurs.png';
import raptors from '../../public/images/logos/raptors.png';
import jazz from '../../public/images/logos/jazz.png';
import wizards from '../../public/images/logos/wizards.png';
import nbaLogo from '../../public/images/logos/_NBA_logo.png';

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
  size?: "xsmall" | "small" | "medium" | "large";
}

const Logo: React.FC<LogoProps> = ({ teamName, size }) => {
  
  const logo = teamLogos[teamName.replace(/\s+/g, '')]; 
  const height = size === "xsmall" ? 24 : size === "small" ? 32 : size === "medium" ? 48 : 64;
  const width = size === "xsmall" ? 24 : size === "small" ? 32 : size === "medium" ? 48 : 64;

  return (
    <div className="flex items-center justify-center bg-transparent rounded-full overflow-hidden">
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