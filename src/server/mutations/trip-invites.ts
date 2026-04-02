import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { TripInvite } from '../../db/collections'

type TripInviteInput = Omit<TripInvite, 'createdAt'> & { createdAt?: Date }

export const insertTripInvite = createServerFn({ method: 'POST' })
  .inputValidator((data: TripInviteInput) => data)
  .handler(async ({ data: invite }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertTripInvite', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
        txn`
          INSERT INTO trip_invites (id, trip_id, token, created_by, expires_at, max_uses, use_count, created_at)
          VALUES (
            ${invite.id},
            ${invite.tripId},
            ${invite.token},
            ${invite.createdBy},
            ${invite.expiresAt},
            ${invite.maxUses},
            ${invite.useCount},
            ${invite.createdAt ?? new Date()}
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

export const deleteTripInvite = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteTripInvite', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM trip_invites WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
