import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { TeeBox } from '../../db/collections'

export const getTeeBoxes = createServerFn({ method: 'GET' }).handler(async (): Promise<TeeBox[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, course_id, tee_name, gender, course_rating, slope_rating, total_yards, par_total
    FROM tee_boxes
  `
  return rows.map((row) => ({
    id: row.id as string,
    courseId: row.course_id as string,
    teeName: row.tee_name as string,
    gender: row.gender as 'male' | 'female',
    courseRating: row.course_rating as number,
    slopeRating: row.slope_rating as number,
    totalYards: row.total_yards as number,
    parTotal: row.par_total as number,
  }))
})

export const getTeeBoxesByCourseId = createServerFn({ method: 'GET' })
  .inputValidator((courseId: string) => courseId)
  .handler(async ({ data: courseId }): Promise<TeeBox[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, course_id, tee_name, gender, course_rating, slope_rating, total_yards, par_total
      FROM tee_boxes
      WHERE course_id = ${courseId}
    `
    return rows.map((row) => ({
      id: row.id as string,
      courseId: row.course_id as string,
      teeName: row.tee_name as string,
      gender: row.gender as 'male' | 'female',
      courseRating: row.course_rating as number,
      slopeRating: row.slope_rating as number,
      totalYards: row.total_yards as number,
      parTotal: row.par_total as number,
    }))
  })
