import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { ChallengeResult } from '../../db/collections'

export const insertChallengeResult = createServerFn({ method: 'POST' })
  .inputValidator((data: ChallengeResult) => data)
  .handler(async ({ data: result }): Promise<{ id: string }> => {
    return wrapMutation('insertChallengeResult', async () => {
      const sql = getDb()

      const insertResult = await sql`
        INSERT INTO challenge_results (id, challenge_id, golfer_id, result_value, result_numeric, is_winner)
        VALUES (
          ${result.id},
          ${result.challengeId},
          ${result.golferId},
          ${result.resultValue},
          ${result.resultNumeric},
          ${result.isWinner}
        )
        RETURNING id
      `

      return { id: insertResult[0].id as string }
    })
  })

export const updateChallengeResult = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<ChallengeResult, 'id' | 'challengeId' | 'golferId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    return wrapMutation('updateChallengeResult', async () => {
      const sql = getDb()

      await sql`
        UPDATE challenge_results
        SET result_value = COALESCE(${changes.resultValue ?? null}, result_value),
            result_numeric = COALESCE(${changes.resultNumeric ?? null}, result_numeric),
            is_winner = COALESCE(${changes.isWinner ?? null}, is_winner)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteChallengeResult = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteChallengeResult', async () => {
      const sql = getDb()

      await sql`DELETE FROM challenge_results WHERE id = ${id}`

      return { id }
    })
  })
