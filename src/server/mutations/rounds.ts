import { createServerFn } from '@tanstack/react-start'
import { getDb, type MutationResult } from './db'
import type { Round } from '../../db/collections'

export const insertRound = createServerFn({ method: 'POST' })
  .inputValidator((data: Round) => data)
  .handler(async ({ data: round }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [insertResult, txidResult] = await sql.transaction((txn) => [
      txn`
        INSERT INTO rounds (id, trip_id, course_id, round_date, round_number, notes, included_in_scoring)
        VALUES (
          ${round.id},
          ${round.tripId},
          ${round.courseId},
          ${round.roundDate},
          ${round.roundNumber},
          ${round.notes},
          ${round.includedInScoring}
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

export const updateRound = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Round, 'id' | 'tripId' | 'courseId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [_updateResult, txidResult] = await sql.transaction((txn) => [
      txn`
        UPDATE rounds
        SET round_date = COALESCE(${changes.roundDate ?? null}, round_date),
            round_number = COALESCE(${changes.roundNumber ?? null}, round_number),
            notes = COALESCE(${changes.notes ?? null}, notes),
            included_in_scoring = COALESCE(${changes.includedInScoring ?? null}, included_in_scoring)
        WHERE id = ${id}
      `,
      txn`SELECT txid_current()::text AS txid`,
    ])

    return {
      id,
      txid: parseInt(txidResult[0].txid as string),
    }
  })

export const deleteRound = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [_deleteResult, txidResult] = await sql.transaction((txn) => [
      txn`DELETE FROM rounds WHERE id = ${id}`,
      txn`SELECT txid_current()::text AS txid`,
    ])

    return {
      id,
      txid: parseInt(txidResult[0].txid as string),
    }
  })
