import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { Hole } from '../../db/collections'

export const getHoles = createServerFn({ method: 'GET' }).handler(async (): Promise<Hole[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, course_id, hole_number, par, stroke_index, yardage
    FROM holes
    ORDER BY course_id, hole_number
  `
  return rows.map((row) => ({
    id: row.id as string,
    courseId: row.course_id as string,
    holeNumber: row.hole_number as number,
    par: row.par as number,
    strokeIndex: row.stroke_index as number,
    yardage: row.yardage as number | null,
  }))
})

export const getHolesByCourseId = createServerFn({ method: 'GET' })
  .inputValidator((courseId: string) => courseId)
  .handler(async ({ data: courseId }): Promise<Hole[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, course_id, hole_number, par, stroke_index, yardage
      FROM holes
      WHERE course_id = ${courseId}
      ORDER BY hole_number
    `
    return rows.map((row) => ({
      id: row.id as string,
      courseId: row.course_id as string,
      holeNumber: row.hole_number as number,
      par: row.par as number,
      strokeIndex: row.stroke_index as number,
      yardage: row.yardage as number | null,
    }))
  })
