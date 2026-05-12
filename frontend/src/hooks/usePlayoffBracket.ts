import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/lib/constants';
import { useSeason } from './useSeason';
import { Event, roundType } from '../types/events';
import { getConference, Conference } from '../lib/teamConferences';

export type BracketRound = Exclude<roundType, 'playin'>;

export interface BracketData {
  firstRound: Record<Conference, Event[]>;
  secondRound: Record<Conference, Event[]>;
  conference: Record<Conference, Event[]>;
  finals: Event[];
}

const EMPTY_BRACKET: BracketData = {
  firstRound: { East: [], West: [] },
  secondRound: { East: [], West: [] },
  conference: { East: [], West: [] },
  finals: [],
};

async function fetchEvents(season: number): Promise<Event[]> {
  const res = await fetch(`/api/events?season=${season}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

function sortSeries(a: Event, b: Event): number {
  const at = a.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER;
  const bt = b.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER;
  if (at !== bt) return at - bt;
  return (a.team1 || '').localeCompare(b.team1 || '');
}

export function usePlayoffBracket() {
  const { season } = useSeason();
  const { data, isLoading, isError } = useQuery({
    queryKey: [QueryKeys.PLAYOFF_BRACKET, season],
    queryFn: () => fetchEvents(season),
    select: (events: Event[]): BracketData => {
      const bracket: BracketData = {
        firstRound: { East: [], West: [] },
        secondRound: { East: [], West: [] },
        conference: { East: [], West: [] },
        finals: [],
      };

      const bracketRounds = new Set<BracketRound>([
        'firstRound',
        'secondRound',
        'conference',
        'finals',
      ]);

      for (const ev of events) {
        if (ev.eventType !== 'series') continue;
        if (!ev.round || !bracketRounds.has(ev.round as BracketRound)) continue;

        if (ev.round === 'finals') {
          bracket.finals.push(ev);
          continue;
        }

        const conf = getConference(ev.team1) || getConference(ev.team2);
        if (!conf) {
          // Defensive: unknown team — bucket into East and warn.
          console.warn('[playoff-bracket] unknown conference for series', ev.id, ev.team1, ev.team2);
          bracket[ev.round as Exclude<BracketRound, 'finals'>].East.push(ev);
          continue;
        }
        bracket[ev.round as Exclude<BracketRound, 'finals'>][conf].push(ev);
      }

      bracket.firstRound.East.sort(sortSeries);
      bracket.firstRound.West.sort(sortSeries);
      bracket.secondRound.East.sort(sortSeries);
      bracket.secondRound.West.sort(sortSeries);
      bracket.conference.East.sort(sortSeries);
      bracket.conference.West.sort(sortSeries);
      bracket.finals.sort(sortSeries);

      return bracket;
    },
  });

  return {
    bracket: data ?? EMPTY_BRACKET,
    isLoading,
    isError,
  };
}
