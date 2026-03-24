import { createServerFn } from '@tanstack/react-start'
import { neon } from '@neondatabase/serverless'
import { wrapMutation } from './db'
import type { Course, TeeBox, Hole } from '../../db/collections'

/**
 * Input type for batched course import.
 * Includes course data plus all tee boxes and holes.
 */
interface CourseImportData {
  course: Course
  teeBoxes: TeeBox[]
  holes: Hole[]
}

/**
 * Import a complete course with all tee boxes and holes in a single transaction.
 * This ensures atomicity and proper Electric sync via a single txid.
 */
export const importCourseWithDetails = createServerFn({ method: 'POST' })
  .inputValidator((data: CourseImportData) => data)
  .handler(async ({ data: { course, teeBoxes, holes } }) => {
    return wrapMutation('importCourseWithDetails', async () => {
      const sql = neon(process.env.DATABASE_URL!)

      // Build all statements for the transaction
      // Neon's transaction() takes a callback that receives txn and returns an array of queries
      const results = await sql.transaction((txn) => {
        const queries = []

        // Insert course
        queries.push(txn`
          INSERT INTO courses (id, api_id, name, club_name, location, address, city, state, country, latitude, longitude, course_rating, slope_rating, total_par)
          VALUES (
            ${course.id},
            ${course.apiId},
            ${course.name},
            ${course.clubName},
            ${course.location},
            ${course.address},
            ${course.city},
            ${course.state},
            ${course.country},
            ${course.latitude},
            ${course.longitude},
            ${course.courseRating},
            ${course.slopeRating},
            ${course.totalPar}
          )
        `)

        // Insert all tee boxes
        for (const tee of teeBoxes) {
          queries.push(txn`
            INSERT INTO tee_boxes (id, course_id, tee_name, gender, course_rating, slope_rating, total_yards, par_total)
            VALUES (
              ${tee.id},
              ${tee.courseId},
              ${tee.teeName},
              ${tee.gender},
              ${tee.courseRating},
              ${tee.slopeRating},
              ${tee.totalYards},
              ${tee.parTotal}
            )
          `)
        }

        // Insert all holes
        for (const hole of holes) {
          queries.push(txn`
            INSERT INTO holes (id, course_id, hole_number, par, stroke_index, yardage)
            VALUES (
              ${hole.id},
              ${hole.courseId},
              ${hole.holeNumber},
              ${hole.par},
              ${hole.strokeIndex},
              ${hole.yardage}
            )
          `)
        }

        // Get txid at the end
        queries.push(txn`SELECT txid_current()::text AS txid`)

        return queries
      })

      const txidResult = results[results.length - 1]
      const txid = parseInt(txidResult[0].txid as string)

      return {
        courseId: course.id,
        teeBoxCount: teeBoxes.length,
        holeCount: holes.length,
        txid,
      }
    })
  })

/**
 * Input type for course resync.
 * Updates course info and replaces all tee boxes and holes.
 */
interface CourseResyncData {
  courseId: string
  courseUpdates: Partial<Omit<Course, 'id'>>
  teeBoxes: TeeBox[]
  holes: Hole[]
}

/**
 * Resync a course by updating its info and replacing tee boxes/holes in a single transaction.
 * Deletes existing tee boxes and holes, then inserts new ones.
 */
export const resyncCourseDetails = createServerFn({ method: 'POST' })
  .inputValidator((data: CourseResyncData) => data)
  .handler(async ({ data: { courseId, courseUpdates, teeBoxes, holes } }) => {
    return wrapMutation('resyncCourseDetails', async () => {
      const sql = neon(process.env.DATABASE_URL!)

      const results = await sql.transaction((txn) => {
        const queries = []

        // Update course info
        queries.push(txn`
          UPDATE courses
          SET name = COALESCE(${courseUpdates.name ?? null}, name),
              club_name = COALESCE(${courseUpdates.clubName ?? null}, club_name),
              course_rating = COALESCE(${courseUpdates.courseRating ?? null}, course_rating),
              slope_rating = COALESCE(${courseUpdates.slopeRating ?? null}, slope_rating),
              total_par = COALESCE(${courseUpdates.totalPar ?? null}, total_par)
          WHERE id = ${courseId}
        `)

        // Delete existing tee boxes and holes (cascade will handle related data)
        queries.push(txn`DELETE FROM tee_boxes WHERE course_id = ${courseId}`)
        queries.push(txn`DELETE FROM holes WHERE course_id = ${courseId}`)

        // Insert new tee boxes
        for (const tee of teeBoxes) {
          queries.push(txn`
            INSERT INTO tee_boxes (id, course_id, tee_name, gender, course_rating, slope_rating, total_yards, par_total)
            VALUES (
              ${tee.id},
              ${tee.courseId},
              ${tee.teeName},
              ${tee.gender},
              ${tee.courseRating},
              ${tee.slopeRating},
              ${tee.totalYards},
              ${tee.parTotal}
            )
          `)
        }

        // Insert new holes
        for (const hole of holes) {
          queries.push(txn`
            INSERT INTO holes (id, course_id, hole_number, par, stroke_index, yardage)
            VALUES (
              ${hole.id},
              ${hole.courseId},
              ${hole.holeNumber},
              ${hole.par},
              ${hole.strokeIndex},
              ${hole.yardage}
            )
          `)
        }

        // Get txid at the end
        queries.push(txn`SELECT txid_current()::text AS txid`)

        return queries
      })

      const txidResult = results[results.length - 1]
      const txid = parseInt(txidResult[0].txid as string)

      return {
        courseId,
        teeBoxCount: teeBoxes.length,
        holeCount: holes.length,
        txid,
      }
    })
  })
