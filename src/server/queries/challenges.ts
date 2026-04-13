import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { Challenge, ChallengeResult } from '../../db/collections'

export const getChallenges = createServerFn({ method: 'GET' }).handler(async (): Promise<Challenge[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, trip_id, name, description, challenge_type, scope, round_id, hole_id, prize_description
    FROM challenges
    ORDER BY name ASC
  `
  return rows.map((row) => ({
    id: row.id as string,
    tripId: row.trip_id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    challengeType: row.challenge_type as 'closest_to_pin' | 'longest_drive' | 'most_birdies' | 'custom',
    scope: row.scope as 'hole' | 'round' | 'trip',
    roundId: row.round_id as string | null,
    holeId: row.hole_id as string | null,
    prizeDescription: (row.prize_description as string) || '',
  }))
})

export const getChallengesByTripId = createServerFn({ method: 'GET' })
  .inputValidator((tripId: string) => tripId)
  .handler(async ({ data: tripId }): Promise<Challenge[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, trip_id, name, description, challenge_type, scope, round_id, hole_id, prize_description
      FROM challenges
      WHERE trip_id = ${tripId}
      ORDER BY name ASC
    `
    return rows.map((row) => ({
      id: row.id as string,
      tripId: row.trip_id as string,
      name: row.name as string,
      description: (row.description as string) || '',
      challengeType: row.challenge_type as 'closest_to_pin' | 'longest_drive' | 'most_birdies' | 'custom',
      scope: row.scope as 'hole' | 'round' | 'trip',
      roundId: row.round_id as string | null,
      holeId: row.hole_id as string | null,
      prizeDescription: (row.prize_description as string) || '',
    }))
  })

export const getChallengeResults = createServerFn({ method: 'GET' }).handler(async (): Promise<ChallengeResult[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, challenge_id, golfer_id, result_value, result_numeric, is_winner
    FROM challenge_results
  `
  return rows.map((row) => ({
    id: row.id as string,
    challengeId: row.challenge_id as string,
    golferId: row.golfer_id as string,
    resultValue: (row.result_value as string) || '',
    resultNumeric: row.result_numeric as number | null,
    isWinner: row.is_winner as boolean,
  }))
})

export const getChallengeResultsByTripId = createServerFn({ method: 'GET' })
  .inputValidator((tripId: string) => tripId)
  .handler(async ({ data: tripId }): Promise<ChallengeResult[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT cr.id, cr.challenge_id, cr.golfer_id, cr.result_value, cr.result_numeric, cr.is_winner
      FROM challenge_results cr
      JOIN challenges c ON cr.challenge_id = c.id
      WHERE c.trip_id = ${tripId}
    `
    return rows.map((row) => ({
      id: row.id as string,
      challengeId: row.challenge_id as string,
      golferId: row.golfer_id as string,
      resultValue: (row.result_value as string) || '',
      resultNumeric: row.result_numeric as number | null,
      isWinner: row.is_winner as boolean,
    }))
  })
