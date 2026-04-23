import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { RoundSummary } from '../../db/collections'
import { getTripRole } from '../auth/authorization'
import { getSession } from '../auth/mutations'

// Helper to get tripId from roundId and verify access
async function requireSummaryAccess(roundId: string, golferId: string): Promise<void> {
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

  // Organizers can manage all summaries
  if (access.role === 'owner' || access.role === 'organizer') {
    return
  }

  // Participants can only manage their own summaries
  if (access.role === 'participant' && access.golferId === golferId) {
    return
  }

  throw new Error('Unauthorized: cannot modify this round summary')
}

export const insertRoundSummary = createServerFn({ method: 'POST' })
  .inputValidator((data: RoundSummary) => data)
  .handler(async ({ data: summary }): Promise<{ id: string }> => {
    // Check authorization
    await requireSummaryAccess(summary.roundId, summary.golferId)

    return wrapMutation('insertRoundSummary', async () => {
      const sql = getDb()

      const result = await sql`
        INSERT INTO round_summaries (id, round_id, golfer_id, total_gross, total_net, total_stableford, birdies_or_better, kps, included_in_scoring)
        VALUES (
          ${summary.id},
          ${summary.roundId},
          ${summary.golferId},
          ${summary.totalGross},
          ${summary.totalNet},
          ${summary.totalStableford},
          ${summary.birdiesOrBetter},
          ${summary.kps},
          ${summary.includedInScoring}
        )
        RETURNING id
      `

      return { id: result[0].id as string }
    })
  })

// Helper to get summary details and verify access
async function requireSummaryAccessById(summaryId: string): Promise<void> {
  const sql = getDb()

  const summaries = await sql`
    SELECT round_id, golfer_id FROM round_summaries WHERE id = ${summaryId} LIMIT 1
  `
  if (summaries.length === 0) throw new Error('Round summary not found')

  await requireSummaryAccess(summaries[0].round_id as string, summaries[0].golfer_id as string)
}

export const updateRoundSummary = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; roundId: string; changes: Partial<Omit<RoundSummary, 'id' | 'roundId' | 'golferId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    // Check authorization
    await requireSummaryAccessById(id)

    return wrapMutation('updateRoundSummary', async () => {
      const sql = getDb()

      await sql`
        UPDATE round_summaries
        SET total_gross = COALESCE(${changes.totalGross ?? null}, total_gross),
            total_net = COALESCE(${changes.totalNet ?? null}, total_net),
            total_stableford = COALESCE(${changes.totalStableford ?? null}, total_stableford),
            birdies_or_better = COALESCE(${changes.birdiesOrBetter ?? null}, birdies_or_better),
            kps = COALESCE(${changes.kps ?? null}, kps),
            included_in_scoring = COALESCE(${changes.includedInScoring ?? null}, included_in_scoring)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteRoundSummary = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    // Check authorization
    await requireSummaryAccessById(id)

    return wrapMutation('deleteRoundSummary', async () => {
      const sql = getDb()

      await sql`DELETE FROM round_summaries WHERE id = ${id}`

      return { id }
    })
  })
