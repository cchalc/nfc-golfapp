import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { Score } from '../../db/collections'
import { getTripRole } from '../auth/authorization'
import { getSession } from '../auth/mutations'

// Helper to get tripId from roundId and verify access
async function requireScoreAccess(roundId: string, golferId: string): Promise<void> {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')

  const sql = getDb()

  // Get the trip for this round
  const rounds = await sql`
    SELECT trip_id FROM rounds WHERE id = ${roundId} LIMIT 1
  `
  if (rounds.length === 0) throw new Error('Round not found')

  const tripId = rounds[0].trip_id as string
  const access = await getTripRole({ data: { tripId } })

  // Organizers can manage all scores
  if (access.role === 'owner' || access.role === 'organizer') {
    return
  }

  // Participants can only manage their own scores
  if (access.role === 'participant' && access.golferId === golferId) {
    return
  }

  throw new Error('Unauthorized: cannot modify this score')
}

export const insertScore = createServerFn({ method: 'POST' })
  .inputValidator((data: Score) => data)
  .handler(async ({ data: score }): Promise<{ id: string }> => {
    // Check authorization
    await requireScoreAccess(score.roundId, score.golferId)

    return wrapMutation('insertScore', async () => {
      const sql = getDb()

      const result = await sql`
        INSERT INTO scores (id, round_id, golfer_id, hole_id, gross_score, handicap_strokes, net_score, stableford_points)
        VALUES (
          ${score.id},
          ${score.roundId},
          ${score.golferId},
          ${score.holeId},
          ${score.grossScore},
          ${score.handicapStrokes},
          ${score.netScore},
          ${score.stablefordPoints}
        )
        RETURNING id
      `

      return { id: result[0].id as string }
    })
  })

// Helper to get score details and verify access
async function requireScoreAccessById(scoreId: string): Promise<void> {
  const sql = getDb()

  const scores = await sql`
    SELECT round_id, golfer_id FROM scores WHERE id = ${scoreId} LIMIT 1
  `
  if (scores.length === 0) throw new Error('Score not found')

  await requireScoreAccess(scores[0].round_id as string, scores[0].golfer_id as string)
}

export const updateScore = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Score, 'id' | 'roundId' | 'golferId' | 'holeId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    // Check authorization
    await requireScoreAccessById(id)

    return wrapMutation('updateScore', async () => {
      const sql = getDb()

      await sql`
        UPDATE scores
        SET gross_score = COALESCE(${changes.grossScore ?? null}, gross_score),
            handicap_strokes = COALESCE(${changes.handicapStrokes ?? null}, handicap_strokes),
            net_score = COALESCE(${changes.netScore ?? null}, net_score),
            stableford_points = COALESCE(${changes.stablefordPoints ?? null}, stableford_points)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteScore = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    // Check authorization
    await requireScoreAccessById(id)

    return wrapMutation('deleteScore', async () => {
      const sql = getDb()

      await sql`DELETE FROM scores WHERE id = ${id}`

      return { id }
    })
  })
