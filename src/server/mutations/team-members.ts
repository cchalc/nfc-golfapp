import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { TeamMember } from '../../db/collections'

export const insertTeamMember = createServerFn({ method: 'POST' })
  .inputValidator((data: TeamMember) => data)
  .handler(async ({ data: teamMember }): Promise<{ id: string }> => {
    return wrapMutation('insertTeamMember', async () => {
      const sql = getDb()

      const result = await sql`
        INSERT INTO team_members (id, team_id, golfer_id, trip_id)
        VALUES (
          ${teamMember.id},
          ${teamMember.teamId},
          ${teamMember.golferId},
          ${teamMember.tripId}
        )
        RETURNING id
      `

      return { id: result[0].id as string }
    })
  })

export const deleteTeamMember = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteTeamMember', async () => {
      const sql = getDb()

      await sql`DELETE FROM team_members WHERE id = ${id}`

      return { id }
    })
  })
