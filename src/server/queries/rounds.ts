import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { Round } from '../../db/collections'

export const getRounds = createServerFn({ method: 'GET' }).handler(async (): Promise<Round[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, trip_id, course_id, round_date, round_number, notes, included_in_scoring
    FROM rounds
    ORDER BY round_date DESC
  `
  return rows.map((row) => ({
    id: row.id as string,
    tripId: row.trip_id as string,
    courseId: row.course_id as string,
    roundDate: new Date(row.round_date as string),
    roundNumber: row.round_number as number,
    notes: (row.notes as string) || '',
    includedInScoring: row.included_in_scoring as boolean,
  }))
})

export const getRoundsByTripId = createServerFn({ method: 'GET' })
  .inputValidator((tripId: string) => tripId)
  .handler(async ({ data: tripId }): Promise<Round[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, trip_id, course_id, round_date, round_number, notes, included_in_scoring
      FROM rounds
      WHERE trip_id = ${tripId}
      ORDER BY round_date ASC, round_number ASC
    `
    return rows.map((row) => ({
      id: row.id as string,
      tripId: row.trip_id as string,
      courseId: row.course_id as string,
      roundDate: new Date(row.round_date as string),
      roundNumber: row.round_number as number,
      notes: (row.notes as string) || '',
      includedInScoring: row.included_in_scoring as boolean,
    }))
  })

export const getRound = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Round | null> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, trip_id, course_id, round_date, round_number, notes, included_in_scoring
      FROM rounds
      WHERE id = ${id}
    `
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      id: row.id as string,
      tripId: row.trip_id as string,
      courseId: row.course_id as string,
      roundDate: new Date(row.round_date as string),
      roundNumber: row.round_number as number,
      notes: (row.notes as string) || '',
      includedInScoring: row.included_in_scoring as boolean,
    }
  })
