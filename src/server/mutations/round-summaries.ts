import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { RoundSummary } from '../../db/collections'

export const insertRoundSummary = createServerFn({ method: 'POST' })
  .inputValidator((data: RoundSummary) => data)
  .handler(async ({ data: summary }): Promise<{ id: string }> => {
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

export const updateRoundSummary = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<RoundSummary, 'id' | 'roundId' | 'golferId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
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
    return wrapMutation('deleteRoundSummary', async () => {
      const sql = getDb()

      await sql`DELETE FROM round_summaries WHERE id = ${id}`

      return { id }
    })
  })
