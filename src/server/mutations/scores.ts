import { createServerFn } from '@tanstack/react-start'
import { getDb, type MutationResult } from './db'
import type { Score } from '../../db/collections'

export const insertScore = createServerFn({ method: 'POST' })
  .inputValidator((data: Score) => data)
  .handler(async ({ data: score }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [insertResult, txidResult] = await sql.transaction((txn) => [
      txn`
        INSERT INTO scores (id, round_id, golfer_id, hole_id, gross_score, handicap_strokes, net_score, stableford_points)
        VALUES (
          ${score.id},
          ${score.roundId},
          ${score.golferId},
          ${score.holeId},
          ${score.grossScore},
          ${score.handicapStrokes},
          ${score.netScore},
          ${score.stablefordPoints}
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

export const updateScore = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Score, 'id' | 'roundId' | 'golferId' | 'holeId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [_updateResult, txidResult] = await sql.transaction((txn) => [
      txn`
        UPDATE scores
        SET gross_score = COALESCE(${changes.grossScore ?? null}, gross_score),
            handicap_strokes = COALESCE(${changes.handicapStrokes ?? null}, handicap_strokes),
            net_score = COALESCE(${changes.netScore ?? null}, net_score),
            stableford_points = COALESCE(${changes.stablefordPoints ?? null}, stableford_points)
        WHERE id = ${id}
      `,
      txn`SELECT txid_current()::text AS txid`,
    ])

    return {
      id,
      txid: parseInt(txidResult[0].txid as string),
    }
  })

export const deleteScore = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [_deleteResult, txidResult] = await sql.transaction((txn) => [
      txn`DELETE FROM scores WHERE id = ${id}`,
      txn`SELECT txid_current()::text AS txid`,
    ])

    return {
      id,
      txid: parseInt(txidResult[0].txid as string),
    }
  })
