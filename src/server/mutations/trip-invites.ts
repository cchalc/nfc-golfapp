import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { TripInvite } from '../../db/collections'

type TripInviteInput = Omit<TripInvite, 'createdAt'> & { createdAt?: Date }

export const insertTripInvite = createServerFn({ method: 'POST' })
  .inputValidator((data: TripInviteInput) => data)
  .handler(async ({ data: invite }): Promise<{ id: string }> => {
    return wrapMutation('insertTripInvite', async () => {
      const sql = getDb()

      const result = await sql`
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
      `

      return { id: result[0].id as string }
    })
  })

export const deleteTripInvite = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteTripInvite', async () => {
      const sql = getDb()

      await sql`DELETE FROM trip_invites WHERE id = ${id}`

      return { id }
    })
  })
