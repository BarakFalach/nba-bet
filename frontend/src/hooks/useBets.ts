import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "@/lib/constants";
import { useUser } from "./useUser";

export interface Bet {
  id: number;
  winnerTeam: string | null;
  winMargin: number;
  result: string;
  pointsGained: number;
  pointsGainedWinMargin: number;
  calcFunc: string;
  closeTime: string;
  created_at: string;
  userId: string;
  eventId: number;
  events: Event
}

export interface Event {
  id: number;
  team1: string;
  team2: string;
  startTime: string;
  eventType: string;
  round: string
  parseEvent: string // ?
  team1Score: number
  team2Score: number
  status: number // ?
}

async function fetchBets(userId: string): Promise<Bet[]> {
  const data = await fetch('/api/bets?userId=' + userId)
  const json = await data.json()
  return json;
  
}

export function useBets() {
  const {user} = useUser();
  const { data: bets, isLoading, isError } = useQuery({
    queryKey: [QueryKeys.BETS],
    queryFn: () =>  fetchBets(user?.id || ""),
  });

  return {
    bets,
    isLoading,
    isError,
  };

  
}