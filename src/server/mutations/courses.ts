import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { Course } from '../../db/collections'

export const insertCourse = createServerFn({ method: 'POST' })
  .inputValidator((data: Course) => data)
  .handler(async ({ data: course }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertCourse', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
        txn`
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

export const updateCourse = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Course, 'id'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('updateCourse', async () => {
      const sql = getDb()

      const [_updateResult, txidResult] = await sql.transaction((txn) => [
        txn`
          UPDATE courses
          SET api_id = COALESCE(${changes.apiId ?? null}, api_id),
              name = COALESCE(${changes.name ?? null}, name),
              club_name = COALESCE(${changes.clubName ?? null}, club_name),
              location = COALESCE(${changes.location ?? null}, location),
              address = COALESCE(${changes.address ?? null}, address),
              city = COALESCE(${changes.city ?? null}, city),
              state = COALESCE(${changes.state ?? null}, state),
              country = COALESCE(${changes.country ?? null}, country),
              latitude = COALESCE(${changes.latitude ?? null}, latitude),
              longitude = COALESCE(${changes.longitude ?? null}, longitude),
              course_rating = COALESCE(${changes.courseRating ?? null}, course_rating),
              slope_rating = COALESCE(${changes.slopeRating ?? null}, slope_rating),
              total_par = COALESCE(${changes.totalPar ?? null}, total_par)
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

export const deleteCourse = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteCourse', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM courses WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
