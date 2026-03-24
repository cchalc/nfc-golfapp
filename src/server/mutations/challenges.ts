import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { Challenge } from '../../db/collections'

export const insertChallenge = createServerFn({ method: 'POST' })
  .inputValidator((data: Challenge) => data)
  .handler(async ({ data: challenge }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertChallenge', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
        txn`
          INSERT INTO challenges (id, trip_id, name, description, challenge_type, scope, round_id, hole_id, prize_description)
          VALUES (
            ${challenge.id},
            ${challenge.tripId},
            ${challenge.name},
            ${challenge.description},
            ${challenge.challengeType},
            ${challenge.scope},
            ${challenge.roundId},
            ${challenge.holeId},
            ${challenge.prizeDescription}
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

export const updateChallenge = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Challenge, 'id' | 'tripId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('updateChallenge', async () => {
      const sql = getDb()

      const [_updateResult, txidResult] = await sql.transaction((txn) => [
        txn`
          UPDATE challenges
          SET name = COALESCE(${changes.name ?? null}, name),
              description = COALESCE(${changes.description ?? null}, description),
              challenge_type = COALESCE(${changes.challengeType ?? null}, challenge_type),
              scope = COALESCE(${changes.scope ?? null}, scope),
              round_id = COALESCE(${changes.roundId ?? null}, round_id),
              hole_id = COALESCE(${changes.holeId ?? null}, hole_id),
              prize_description = COALESCE(${changes.prizeDescription ?? null}, prize_description)
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

export const deleteChallenge = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteChallenge', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM challenges WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
