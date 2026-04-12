import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { Team, TeamMember } from '../../db/collections'

export const getTeams = createServerFn({ method: 'GET' }).handler(async (): Promise<Team[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, trip_id, name, color
    FROM teams
    ORDER BY name ASC
  `
  return rows.map((row) => ({
    id: row.id as string,
    tripId: row.trip_id as string,
    name: row.name as string,
    color: (row.color as string) || '#3b82f6',
  }))
})

export const getTeamsByTripId = createServerFn({ method: 'GET' })
  .inputValidator((tripId: string) => tripId)
  .handler(async ({ data: tripId }): Promise<Team[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, trip_id, name, color
      FROM teams
      WHERE trip_id = ${tripId}
      ORDER BY name ASC
    `
    return rows.map((row) => ({
      id: row.id as string,
      tripId: row.trip_id as string,
      name: row.name as string,
      color: (row.color as string) || '#3b82f6',
    }))
  })

export const getTeamMembers = createServerFn({ method: 'GET' }).handler(async (): Promise<TeamMember[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, team_id, golfer_id, trip_id
    FROM team_members
  `
  return rows.map((row) => ({
    id: row.id as string,
    teamId: row.team_id as string,
    golferId: row.golfer_id as string,
    tripId: row.trip_id as string,
  }))
})

export const getTeamMembersByTripId = createServerFn({ method: 'GET' })
  .inputValidator((tripId: string) => tripId)
  .handler(async ({ data: tripId }): Promise<TeamMember[]> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, team_id, golfer_id, trip_id
      FROM team_members
      WHERE trip_id = ${tripId}
    `
    return rows.map((row) => ({
      id: row.id as string,
      teamId: row.team_id as string,
      golferId: row.golfer_id as string,
      tripId: row.trip_id as string,
    }))
  })
