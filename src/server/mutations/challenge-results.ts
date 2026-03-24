import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { ChallengeResult } from '../../db/collections'

export const insertChallengeResult = createServerFn({ method: 'POST' })
  .inputValidator((data: ChallengeResult) => data)
  .handler(async ({ data: result }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertChallengeResult', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
        txn`
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
        `,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id: insertResult[0].id as string,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })

export const updateChallengeResult = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<ChallengeResult, 'id' | 'challengeId' | 'golferId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('updateChallengeResult', async () => {
      const sql = getDb()

      const [_updateResult, txidResult] = await sql.transaction((txn) => [
        txn`
          UPDATE challenge_results
          SET result_value = COALESCE(${changes.resultValue ?? null}, result_value),
              result_numeric = COALESCE(${changes.resultNumeric ?? null}, result_numeric),
              is_winner = COALESCE(${changes.isWinner ?? null}, is_winner)
          WHERE id = ${id}
        `,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })

export const deleteChallengeResult = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteChallengeResult', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM challenge_results WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
