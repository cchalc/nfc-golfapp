import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { Trip } from '../../db/collections'
import { getSession } from '../auth'

type TripInput = Omit<Trip, 'createdAt'> & { createdAt?: Date }

export const insertTrip = createServerFn({ method: 'POST' })
  .inputValidator((data: TripInput) => data)
  .handler(async ({ data: trip }): Promise<{ id: string }> => {
    return wrapMutation('insertTrip', async () => {
      const sql = getDb()

      // Get current session to auto-add creator as owner
      const session = await getSession()

      const [insertResult] = await sql.transaction((txn) => [
        txn`
          INSERT INTO trips (id, name, description, start_date, end_date, location, created_by, created_at)
          VALUES (
            ${trip.id},
            ${trip.name},
            ${trip.description},
            ${trip.startDate},
            ${trip.endDate},
            ${trip.location},
            ${trip.createdBy},
            ${trip.createdAt ?? new Date()}
          )
          RETURNING id
        `,
        // Auto-add creator as owner if authenticated
        session?.identityId
          ? txn`
            INSERT INTO trip_organizers (trip_id, identity_id, role)
            VALUES (${trip.id}, ${session.identityId}, 'owner')
            ON CONFLICT (trip_id, identity_id) DO UPDATE SET role = 'owner'
          `
          : txn`SELECT 1`,
      ])

      return { id: insertResult[0].id as string }
    })
  })

export const updateTrip = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Trip, 'id' | 'createdAt' | 'createdBy'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    return wrapMutation('updateTrip', async () => {
      const sql = getDb()

      await sql`
        UPDATE trips
        SET name = COALESCE(${changes.name ?? null}, name),
            description = COALESCE(${changes.description ?? null}, description),
            start_date = COALESCE(${changes.startDate ?? null}, start_date),
            end_date = COALESCE(${changes.endDate ?? null}, end_date),
            location = COALESCE(${changes.location ?? null}, location)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteTrip = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteTrip', async () => {
      const sql = getDb()

      await sql`DELETE FROM trips WHERE id = ${id}`

      return { id }
    })
  })
