import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { Score } from '../../db/collections'

export const getScores = createServerFn({ method: 'GET' }).handler(async (): Promise<Score[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, round_id, golfer_id, hole_id, gross_score, handicap_strokes, net_score, stableford_points
    FROM scores
  `
  return rows.map((row) => ({
    id: row.id as string,
    roundId: row.round_id as string,
    golferId: row.golfer_id as string,
    holeId: row.hole_id as string,
    grossScore: row.gross_score as number,
    handicapStrokes: row.handicap_strokes as number,
    netScore: row.net_score as number,
    stablefordPoints: row.stableford_points as number,
  }))
})

export const getScoresByRoundId = createServerFn({ method: 'GET' })
  .inputValidator((roundId: string) => roundId)
  .handler(async ({ data: roundId }): Promise<Score[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, round_id, golfer_id, hole_id, gross_score, handicap_strokes, net_score, stableford_points
      FROM scores
      WHERE round_id = ${roundId}
    `
    return rows.map((row) => ({
      id: row.id as string,
      roundId: row.round_id as string,
      golferId: row.golfer_id as string,
      holeId: row.hole_id as string,
      grossScore: row.gross_score as number,
      handicapStrokes: row.handicap_strokes as number,
      netScore: row.net_score as number,
      stablefordPoints: row.stableford_points as number,
    }))
  })
