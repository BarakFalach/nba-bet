import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "@/lib/constants";
import { useUser } from "./useUser";
import { Bet } from "../types/bets";
import { Event } from "../types/events";

export interface EnhancedBet extends Bet {
  events: Event
}

async function fetchBets(userId: string): Promise<EnhancedBet[]> {
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

  const unplacedBets = bets?.filter((bet: EnhancedBet) => 
    bet.winnerTeam === null && bet.winMargin === null
  )

  const placedBets = bets?.filter((bet: EnhancedBet) =>
    bet.winnerTeam !== null && bet.winMargin !== null && bet.result === null
  )

  const resolvedBets = bets?.filter((bet: EnhancedBet) => 
    bet.result !== null )

  return {
    bets,
    unplacedBets : unplacedBets || [],
    placedBets : placedBets || [],
    resolvedBets: resolvedBets || [],
    isLoading,
    isError,
  };

  
}