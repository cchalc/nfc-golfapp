import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { RoundSummary } from '../../db/collections'

export const getRoundSummaries = createServerFn({ method: 'GET' }).handler(async (): Promise<RoundSummary[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, round_id, golfer_id, total_gross, total_net, total_stableford, birdies_or_better, kps, included_in_scoring
    FROM round_summaries
  `
  return rows.map((row) => ({
    id: row.id as string,
    roundId: row.round_id as string,
    golferId: row.golfer_id as string,
    totalGross: row.total_gross as number,
    totalNet: row.total_net as number,
    totalStableford: row.total_stableford as number,
    birdiesOrBetter: row.birdies_or_better as number,
    kps: row.kps as number,
    includedInScoring: row.included_in_scoring as boolean,
  }))
})

export const getRoundSummariesByRoundId = createServerFn({ method: 'GET' })
  .inputValidator((roundId: string) => roundId)
  .handler(async ({ data: roundId }): Promise<RoundSummary[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, round_id, golfer_id, total_gross, total_net, total_stableford, birdies_or_better, kps, included_in_scoring
      FROM round_summaries
      WHERE round_id = ${roundId}
    `
    return rows.map((row) => ({
      id: row.id as string,
      roundId: row.round_id as string,
      golferId: row.golfer_id as string,
      totalGross: row.total_gross as number,
      totalNet: row.total_net as number,
      totalStableford: row.total_stableford as number,
      birdiesOrBetter: row.birdies_or_better as number,
      kps: row.kps as number,
      includedInScoring: row.included_in_scoring as boolean,
    }))
  })

export const getRoundSummariesByTripId = createServerFn({ method: 'GET' })
  .inputValidator((tripId: string) => tripId)
  .handler(async ({ data: tripId }): Promise<RoundSummary[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT rs.id, rs.round_id, rs.golfer_id, rs.total_gross, rs.total_net, rs.total_stableford, rs.birdies_or_better, rs.kps, rs.included_in_scoring
      FROM round_summaries rs
      JOIN rounds r ON rs.round_id = r.id
      WHERE r.trip_id = ${tripId}
    `
    return rows.map((row) => ({
      id: row.id as string,
      roundId: row.round_id as string,
      golferId: row.golfer_id as string,
      totalGross: row.total_gross as number,
      totalNet: row.total_net as number,
      totalStableford: row.total_stableford as number,
      birdiesOrBetter: row.birdies_or_better as number,
      kps: row.kps as number,
      includedInScoring: row.included_in_scoring as boolean,
    }))
  })
