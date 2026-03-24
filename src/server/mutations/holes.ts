import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { Hole } from '../../db/collections'

export const insertHole = createServerFn({ method: 'POST' })
  .inputValidator((data: Hole) => data)
  .handler(async ({ data: hole }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertHole', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
        txn`
          INSERT INTO holes (id, course_id, hole_number, par, stroke_index, yardage)
          VALUES (
            ${hole.id},
            ${hole.courseId},
            ${hole.holeNumber},
            ${hole.par},
            ${hole.strokeIndex},
            ${hole.yardage}
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

export const updateHole = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Hole, 'id' | 'courseId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('updateHole', async () => {
      const sql = getDb()

      const [_updateResult, txidResult] = await sql.transaction((txn) => [
        txn`
          UPDATE holes
          SET hole_number = COALESCE(${changes.holeNumber ?? null}, hole_number),
              par = COALESCE(${changes.par ?? null}, par),
              stroke_index = COALESCE(${changes.strokeIndex ?? null}, stroke_index),
              yardage = COALESCE(${changes.yardage ?? null}, yardage)
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

export const deleteHole = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteHole', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM holes WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
