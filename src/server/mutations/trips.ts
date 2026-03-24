import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { Trip } from '../../db/collections'

type TripInput = Omit<Trip, 'createdAt'> & { createdAt?: Date }

export const insertTrip = createServerFn({ method: 'POST' })
  .inputValidator((data: TripInput) => data)
  .handler(async ({ data: trip }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertTrip', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
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
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id: insertResult[0].id as string,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })

export const updateTrip = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Trip, 'id' | 'createdAt' | 'createdBy'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('updateTrip', async () => {
      const sql = getDb()

      const [_updateResult, txidResult] = await sql.transaction((txn) => [
        txn`
          UPDATE trips
          SET name = COALESCE(${changes.name ?? null}, name),
              description = COALESCE(${changes.description ?? null}, description),
              start_date = COALESCE(${changes.startDate ?? null}, start_date),
              end_date = COALESCE(${changes.endDate ?? null}, end_date),
              location = COALESCE(${changes.location ?? null}, location)
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

export const deleteTrip = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteTrip', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM trips WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
