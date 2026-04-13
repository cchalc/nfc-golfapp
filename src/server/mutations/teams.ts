import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { Team } from '../../db/collections'

export const insertTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: Team) => data)
  .handler(async ({ data: team }): Promise<{ id: string }> => {
    return wrapMutation('insertTeam', async () => {
      const sql = getDb()

      const result = await sql`
        INSERT INTO teams (id, trip_id, name, color)
        VALUES (
          ${team.id},
          ${team.tripId},
          ${team.name},
          ${team.color}
        )
        RETURNING id
      `

      return { id: result[0].id as string }
    })
  })

export const updateTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Team, 'id' | 'tripId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    return wrapMutation('updateTeam', async () => {
      const sql = getDb()

      await sql`
        UPDATE teams
        SET name = COALESCE(${changes.name ?? null}, name),
            color = COALESCE(${changes.color ?? null}, color)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteTeam', async () => {
      const sql = getDb()

      await sql`DELETE FROM teams WHERE id = ${id}`

      return { id }
    })
  })
