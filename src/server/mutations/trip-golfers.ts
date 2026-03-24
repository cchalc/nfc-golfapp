import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { TripGolfer } from '../../db/collections'

type TripGolferInput = Omit<TripGolfer, 'invitedAt'> & { invitedAt?: Date }

export const insertTripGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: TripGolferInput) => data)
  .handler(async ({ data: tripGolfer }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertTripGolfer', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
        txn`
          INSERT INTO trip_golfers (id, trip_id, golfer_id, status, invited_at, accepted_at, included_in_scoring, handicap_override)
          VALUES (
            ${tripGolfer.id},
            ${tripGolfer.tripId},
            ${tripGolfer.golferId},
            ${tripGolfer.status},
            ${tripGolfer.invitedAt ?? new Date()},
            ${tripGolfer.acceptedAt},
            ${tripGolfer.includedInScoring},
            ${tripGolfer.handicapOverride}
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

export const updateTripGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<TripGolfer, 'id' | 'tripId' | 'golferId' | 'invitedAt'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('updateTripGolfer', async () => {
      const sql = getDb()

      const [_updateResult, txidResult] = await sql.transaction((txn) => [
        txn`
          UPDATE trip_golfers
          SET status = COALESCE(${changes.status ?? null}, status),
              accepted_at = COALESCE(${changes.acceptedAt ?? null}, accepted_at),
              included_in_scoring = COALESCE(${changes.includedInScoring ?? null}, included_in_scoring),
              handicap_override = COALESCE(${changes.handicapOverride ?? null}, handicap_override)
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

export const deleteTripGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteTripGolfer', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM trip_golfers WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
