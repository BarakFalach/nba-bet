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
    select: (data) => {
      const validBets = data.filter((bet: EnhancedBet) => bet.events.startTime !== null);

      return validBets.sort((a: EnhancedBet, b: EnhancedBet) => {
        const dateA = new Date(a.events.startTime);
        const dateB = new Date(b.events.startTime);
        return dateA.getTime() - dateB.getTime();
      }
      )
    }
  });



  const unplacedBets = bets?.filter((bet: EnhancedBet) => 
    bet.winnerTeam === null && bet.winMargin === null && bet.result === null
  )

  const placedBets = bets?.filter((bet: EnhancedBet) =>
    bet.winnerTeam !== null && bet.winMargin !== null && bet.result === null
  )

  const resolvedBets = bets?.filter((bet: EnhancedBet) => 
    bet.events.status === 3 )

  const currentlyActiveBets = bets?.filter((bet: EnhancedBet) =>
    bet.events.status === 2
)

  return {
    unplacedBets : unplacedBets || [],    
    placedBets : placedBets || [],
    resolvedBets: resolvedBets || [],
    currentlyActiveBets: currentlyActiveBets || [],
    isLoading,
    isError,
  };
}