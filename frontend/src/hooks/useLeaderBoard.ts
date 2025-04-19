import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/constants'
import { useUser } from './useUser'
import { LeaderBoardRow } from '../types/leaderBoard';

export const useLeaderBoard = () => {

  const {user} = useUser();
  const userId = user?.id || null;

  const { data: leaderboard, isLoading, isError } = useQuery<LeaderBoardRow[]>({
    queryKey: [QueryKeys.LEADERBOARD, userId],
    queryFn: () => fetch(`/api/leaderBoard?userId=${userId}`).then(res => res.json()),
    enabled: !!userId,
  })


  // Optional: compute rank + userScore for current user
  const totalUsers = leaderboard?.length
  const userRank = (leaderboard?.findIndex((entry) => entry.email.toLowerCase() === (user?.email?.toLowerCase() ?? '')) ?? -1) + 1
  const userScore = leaderboard?.find((entry) => entry.email.toLowerCase() === user?.email?.toLowerCase())?.score || 0
  const topScore = leaderboard?.[0]?.score || 0

  return {
    isLoading,
    isError,
    userRank,
    totalUsers,
    userScore,
    topScore,
    leaderboard,
  }
}