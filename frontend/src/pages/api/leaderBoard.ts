import { supabase } from '@/lib/supabaseClient';

export default async function handler(req, res) {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  // Step 1: Fetch all bets with userId and points
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('userId, pointsGained')

  if (betsError) return res.status(500).json({ error: betsError.message })

  // Step 2: Aggregate total points per user
  const userScores = new Map()
  for (const bet of bets) {
    const uid = bet.userId
    const points = bet.pointsGained || 0
    userScores.set(uid, (userScores.get(uid) || 0) + points)
  }

  const userIds = Array.from(userScores.keys())

  // Step 3: Fetch user names from Users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('uuid, name, email')
    .in('uuid', userIds)

  if (usersError) return res.status(500).json({ error: usersError.message })

    const uuidToUser = new Map(users.map(u => [u.uuid, { name: u.name, email: u.email }]))


  // Step 4: Build leaderboard list
  const leaderboard = Array.from(userScores.entries())
  .map(([uuid, score]) => {
    const user = uuidToUser.get(uuid) || { name: 'Unknown', email: '' }
    return {
      name: user.name,
      email: user.email,
      score,
      userId: uuid,
    }
  })
  .sort((a, b) => b.score - a.score)


  // Return just name + score for each user
  return res.status(200).json(
    leaderboard.map(({ name, email, score }) => ({ name, email, score })),
  )
}
