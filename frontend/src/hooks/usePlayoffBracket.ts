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

function fallbackSort(a: Event, b: Event): number {
  const at = a.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER;
  const bt = b.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER;
  if (at !== bt) return at - bt;
  return (a.team1 || '').localeCompare(b.team1 || '');
}

// Find the lower-round series whose participants include `team`.
function findFeeder(team: string, candidates: Event[]): Event | undefined {
  if (!team) return undefined;
  return candidates.find((s) => s.team1 === team || s.team2 === team);
}

/**
 * Order a conference's series so that adjacent items in R1 feed the same SF,
 * and adjacent SF items feed the CF. Trace top-down from CF → SF → R1.
 *
 * Falls back gracefully when later-round series are missing or have unset teams.
 */
function orderConference(
  r1: Event[],
  sf: Event[],
  cf: Event[],
): { r1: Event[]; sf: Event[]; cf: Event[] } {
  const r1Pool = [...r1].sort(fallbackSort);
  const sfPool = [...sf].sort(fallbackSort);
  const cfPool = [...cf].sort(fallbackSort);

  // Order SF based on CF's two participants.
  let orderedSf: Event[] = [];
  const cfSeries = cfPool[0];
  if (cfSeries && cfSeries.team1 && cfSeries.team2) {
    const sfTop = findFeeder(cfSeries.team1, sfPool);
    const sfBot = findFeeder(cfSeries.team2, sfPool);
    if (sfTop) orderedSf.push(sfTop);
    if (sfBot && sfBot !== sfTop) orderedSf.push(sfBot);
  }
  // Append any SF series not placed by the trace.
  for (const s of sfPool) {
    if (!orderedSf.includes(s)) orderedSf.push(s);
  }

  // Order R1 based on each SF's participants.
  const orderedR1: Event[] = [];
  for (const sfSeries of orderedSf) {
    if (sfSeries.team1) {
      const r1Top = findFeeder(sfSeries.team1, r1Pool);
      if (r1Top && !orderedR1.includes(r1Top)) orderedR1.push(r1Top);
    }
    if (sfSeries.team2) {
      const r1Bot = findFeeder(sfSeries.team2, r1Pool);
      if (r1Bot && !orderedR1.includes(r1Bot)) orderedR1.push(r1Bot);
    }
  }
  // Append any R1 series not placed by the trace.
  for (const s of r1Pool) {
    if (!orderedR1.includes(s)) orderedR1.push(s);
  }

  return { r1: orderedR1, sf: orderedSf, cf: cfPool };
}

export function usePlayoffBracket() {
  const { season } = useSeason();
  const { data, isLoading, isError } = useQuery({
    queryKey: [QueryKeys.PLAYOFF_BRACKET, season],
    queryFn: () => fetchEvents(season),
    select: (events: Event[]): BracketData => {
      // First bucket series by round and conference.
      const buckets = {
        firstRound: { East: [] as Event[], West: [] as Event[] },
        secondRound: { East: [] as Event[], West: [] as Event[] },
        conference: { East: [] as Event[], West: [] as Event[] },
        finals: [] as Event[],
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
          buckets.finals.push(ev);
          continue;
        }

        const conf = getConference(ev.team1) || getConference(ev.team2);
        if (!conf) {
          console.warn(
            '[playoff-bracket] unknown conference for series',
            ev.id,
            ev.team1,
            ev.team2,
          );
          buckets[ev.round as Exclude<BracketRound, 'finals'>].East.push(ev);
          continue;
        }
        buckets[ev.round as Exclude<BracketRound, 'finals'>][conf].push(ev);
      }

      // Now order each conference using feeder tracing.
      const east = orderConference(
        buckets.firstRound.East,
        buckets.secondRound.East,
        buckets.conference.East,
      );
      const west = orderConference(
        buckets.firstRound.West,
        buckets.secondRound.West,
        buckets.conference.West,
      );

      return {
        firstRound: { East: east.r1, West: west.r1 },
        secondRound: { East: east.sf, West: west.sf },
        conference: { East: east.cf, West: west.cf },
        finals: [...buckets.finals].sort(fallbackSort),
      };
    },
  });

  return {
    bracket: data ?? EMPTY_BRACKET,
    isLoading,
    isError,
  };
}
