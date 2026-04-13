import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { TeeBox } from '../../db/collections'

export const insertTeeBox = createServerFn({ method: 'POST' })
  .inputValidator((data: TeeBox) => data)
  .handler(async ({ data: teeBox }): Promise<{ id: string }> => {
    return wrapMutation('insertTeeBox', async () => {
      const sql = getDb()

      const result = await sql`
        INSERT INTO tee_boxes (id, course_id, tee_name, gender, course_rating, slope_rating, total_yards, par_total)
        VALUES (
          ${teeBox.id},
          ${teeBox.courseId},
          ${teeBox.teeName},
          ${teeBox.gender},
          ${teeBox.courseRating},
          ${teeBox.slopeRating},
          ${teeBox.totalYards},
          ${teeBox.parTotal}
        )
        RETURNING id
      `

      return { id: result[0].id as string }
    })
  })

export const updateTeeBox = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<TeeBox, 'id' | 'courseId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    return wrapMutation('updateTeeBox', async () => {
      const sql = getDb()

      await sql`
        UPDATE tee_boxes
        SET tee_name = COALESCE(${changes.teeName ?? null}, tee_name),
            gender = COALESCE(${changes.gender ?? null}, gender),
            course_rating = COALESCE(${changes.courseRating ?? null}, course_rating),
            slope_rating = COALESCE(${changes.slopeRating ?? null}, slope_rating),
            total_yards = COALESCE(${changes.totalYards ?? null}, total_yards),
            par_total = COALESCE(${changes.parTotal ?? null}, par_total)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteTeeBox = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteTeeBox', async () => {
      const sql = getDb()

      await sql`DELETE FROM tee_boxes WHERE id = ${id}`

      return { id }
    })
  })
