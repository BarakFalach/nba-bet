import { supabase } from '@/lib/supabaseClient';

export default async function handler(req, res) {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  // Step 1: Fetch all bets with userId and points
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('userId, pointsGained, pointsGainedWinMargin')

  if (betsError) return res.status(500).json({ error: betsError.message })

  // Step 1b: Fetch all finals bets with user IDs and team names
  const { data: finalsBets, error: finalsBetsError } = await supabase
    .from('finals_bet')
    .select('userId, finalsBet, pointsGained')
  
  if (finalsBetsError) return res.status(500).json({ error: finalsBetsError.message })

  // Step 1c: Fetch all finals MVP bets with user IDs and player names
  const { data: finalsMvpBets, error: finalsMvpBetsError } = await supabase
    .from('finals_mvp_bet')
    .select('userId, playerName, playerId, pointsGained')
  
  if (finalsMvpBetsError) return res.status(500).json({ error: finalsMvpBetsError.message })

  // Step 2: Aggregate total points per user
  const userScores = new Map()
  const userFinalsBets = new Map() // Store finals bet info per user
  const userFinalsMvpBets = new Map() // Store finals MVP bet info per user
  
  // Process regular bets
  for (const bet of bets || []) {
    const uid = bet.userId
    const points = (bet.pointsGained || 0) + (bet.pointsGainedWinMargin || 0)
    userScores.set(uid, (userScores.get(uid) || 0) + points)
  }
  
  // Process finals bets
  for (const finalsBet of finalsBets || []) {
    const uid = finalsBet.userId
    // Add points from finals bet (if available)
    if (finalsBet.pointsGained) {
      userScores.set(uid, (userScores.get(uid) || 0) + (finalsBet.pointsGained || 0))
    }
    // Store the team name for this user's finals bet
    userFinalsBets.set(uid, finalsBet.finalsBet)
    
    // Make sure this user is included in the leaderboard even if they have no other bets
    if (!userScores.has(uid)) {
      userScores.set(uid, 0)
    }
  }
  
  // Process finals MVP bets
  for (const finalsMvpBet of finalsMvpBets || []) {
    const uid = finalsMvpBet.userId
    // Add points from finals MVP bet (if available)
    if (finalsMvpBet.pointsGained) {
      userScores.set(uid, (userScores.get(uid) || 0) + (finalsMvpBet.pointsGained || 0))
    }
    // Store the player name and ID for this user's finals MVP bet
    userFinalsMvpBets.set(uid, {
      playerName: finalsMvpBet.playerName,
      playerId: finalsMvpBet.playerId
    })
    
    // Make sure this user is included in the leaderboard even if they have no other bets
    if (!userScores.has(uid)) {
      userScores.set(uid, 0)
    }
  }

  // Get combined list of all user IDs who have placed any type of bet
  const userIds = Array.from(new Set([
    ...userScores.keys(),
    ...userFinalsBets.keys(),
    ...userFinalsMvpBets.keys()
  ]))

  // Step 3: Fetch user names from Users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('uuid, name, email')
    .in('uuid', userIds)

  if (usersError) return res.status(500).json({ error: usersError.message })

  const uuidToUser = new Map(users.map(u => [u.uuid, { name: u.name, email: u.email }]))

  // Step 4: Build leaderboard list with finals bet and finals MVP bet information
  const leaderboard = userIds.map(uuid => {
    const user = uuidToUser.get(uuid) || { name: 'Unknown', email: '' }
    const finalsMvpBet = userFinalsMvpBets.get(uuid) || null;
    
    return {
      name: user.name,
      email: user.email,
      score: userScores.get(uuid) || 0,
      userId: uuid,
      finalsBet: userFinalsBets.get(uuid) || null,
      finalsMvpBet: finalsMvpBet ? finalsMvpBet.playerName : null,
      finalsMvpPlayerId: finalsMvpBet ? finalsMvpBet.playerId : null
    }
  })
  .sort((a, b) => b.score - a.score)

  // Return user data with score, finals bet, and finals MVP bet
  return res.status(200).json(
    leaderboard.map(({ name, email, score, finalsBet, finalsMvpBet, finalsMvpPlayerId }) => ({ 
      name, 
      email, 
      score,
      finalsBet,
      finalsMvpBet,
      finalsMvpPlayerId
    })),
  )
}