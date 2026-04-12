import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { Course } from '../../db/collections'

export const getCourses = createServerFn({ method: 'GET' }).handler(async (): Promise<Course[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, api_id, name, club_name, location, address, city, state, country,
           latitude, longitude, course_rating, slope_rating, total_par
    FROM courses
    ORDER BY name ASC
  `
  return rows.map((row) => ({
    id: row.id as string,
    apiId: row.api_id as number | null,
    name: row.name as string,
    clubName: (row.club_name as string) || '',
    location: (row.location as string) || '',
    address: (row.address as string) || '',
    city: (row.city as string) || '',
    state: (row.state as string) || '',
    country: (row.country as string) || '',
    latitude: row.latitude as number | null,
    longitude: row.longitude as number | null,
    courseRating: row.course_rating as number | null,
    slopeRating: row.slope_rating as number | null,
    totalPar: (row.total_par as number) || 72,
  }))
})

export const getCourse = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Course | null> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, api_id, name, club_name, location, address, city, state, country,
             latitude, longitude, course_rating, slope_rating, total_par
      FROM courses
      WHERE id = ${id}
    `
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      id: row.id as string,
      apiId: row.api_id as number | null,
      name: row.name as string,
      clubName: (row.club_name as string) || '',
      location: (row.location as string) || '',
      address: (row.address as string) || '',
      city: (row.city as string) || '',
      state: (row.state as string) || '',
      country: (row.country as string) || '',
      latitude: row.latitude as number | null,
      longitude: row.longitude as number | null,
      courseRating: row.course_rating as number | null,
      slopeRating: row.slope_rating as number | null,
      totalPar: (row.total_par as number) || 72,
    }
  })
