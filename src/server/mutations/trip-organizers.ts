import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { TripOrganizer } from '../../db/collections'

type TripOrganizerInput = Omit<TripOrganizer, 'addedAt'> & { addedAt?: Date }

export const insertTripOrganizer = createServerFn({ method: 'POST' })
  .inputValidator((data: TripOrganizerInput) => data)
  .handler(async ({ data: organizer }): Promise<{ id: string }> => {
    return wrapMutation('insertTripOrganizer', async () => {
      const sql = getDb()

      const result = await sql`
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
      `

      return { id: result[0].id as string }
    })
  })

export const updateTripOrganizer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<TripOrganizer, 'id' | 'addedAt'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    return wrapMutation('updateTripOrganizer', async () => {
      const sql = getDb()

      await sql`
        UPDATE trip_organizers
        SET role = COALESCE(${changes.role ?? null}, role)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteTripOrganizer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteTripOrganizer', async () => {
      const sql = getDb()

      await sql`DELETE FROM trip_organizers WHERE id = ${id}`

      return { id }
    })
  })
