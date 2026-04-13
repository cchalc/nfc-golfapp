import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { Trip } from '../../db/collections'

export const getTrips = createServerFn({ method: 'GET' }).handler(async (): Promise<Trip[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, name, description, start_date, end_date, location, created_by, created_at
    FROM trips
    ORDER BY start_date DESC
  `
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    startDate: new Date(row.start_date as string),
    endDate: new Date(row.end_date as string),
    location: (row.location as string) || '',
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
  }))
})

export const getTrip = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Trip | null> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, name, description, start_date, end_date, location, created_by, created_at
      FROM trips
      WHERE id = ${id}
    `
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) || '',
      startDate: new Date(row.start_date as string),
      endDate: new Date(row.end_date as string),
      location: (row.location as string) || '',
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
    }
  })
