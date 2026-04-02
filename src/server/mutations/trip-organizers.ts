import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { TripOrganizer } from '../../db/collections'

type TripOrganizerInput = Omit<TripOrganizer, 'addedAt'> & { addedAt?: Date }

export const insertTripOrganizer = createServerFn({ method: 'POST' })
  .inputValidator((data: TripOrganizerInput) => data)
  .handler(async ({ data: organizer }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertTripOrganizer', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
        txn`
          INSERT INTO trip_organizers (id, trip_id, identity_id, role, added_at)
          VALUES (
            ${organizer.id},
            ${organizer.tripId},
            ${organizer.identityId},
            ${organizer.role},
            ${organizer.addedAt ?? new Date()}
          )
          ON CONFLICT (trip_id, identity_id) DO UPDATE SET role = EXCLUDED.role
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

export const updateTripOrganizer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<TripOrganizer, 'id' | 'addedAt'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('updateTripOrganizer', async () => {
      const sql = getDb()

      const [_updateResult, txidResult] = await sql.transaction((txn) => [
        txn`
          UPDATE trip_organizers
          SET role = COALESCE(${changes.role ?? null}, role)
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

export const deleteTripOrganizer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteTripOrganizer', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM trip_organizers WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
