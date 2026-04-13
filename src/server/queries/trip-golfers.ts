import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { TripGolfer } from '../../db/collections'

export const getTripGolfers = createServerFn({ method: 'GET' }).handler(async (): Promise<TripGolfer[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, trip_id, golfer_id, status, invited_at, accepted_at, included_in_scoring, handicap_override
    FROM trip_golfers
  `
  return rows.map((row) => ({
    id: row.id as string,
    tripId: row.trip_id as string,
    golferId: row.golfer_id as string,
    status: row.status as 'invited' | 'accepted' | 'declined',
    invitedAt: new Date(row.invited_at as string),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : null,
    includedInScoring: row.included_in_scoring as boolean,
    handicapOverride: row.handicap_override as number | null,
  }))
})

export const getTripGolfersByTripId = createServerFn({ method: 'GET' })
  .inputValidator((tripId: string) => tripId)
  .handler(async ({ data: tripId }): Promise<TripGolfer[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, trip_id, golfer_id, status, invited_at, accepted_at, included_in_scoring, handicap_override
      FROM trip_golfers
      WHERE trip_id = ${tripId}
    `
    return rows.map((row) => ({
      id: row.id as string,
      tripId: row.trip_id as string,
      golferId: row.golfer_id as string,
      status: row.status as 'invited' | 'accepted' | 'declined',
      invitedAt: new Date(row.invited_at as string),
      acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : null,
      includedInScoring: row.included_in_scoring as boolean,
      handicapOverride: row.handicap_override as number | null,
    }))
  })

export const getTripGolferCounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ tripId: string; count: number }[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT trip_id, COUNT(*)::int as count
      FROM trip_golfers
      WHERE status = 'accepted'
      GROUP BY trip_id
    `
    return rows.map((row) => ({
      tripId: row.trip_id as string,
      count: row.count as number,
    }))
  }
)
