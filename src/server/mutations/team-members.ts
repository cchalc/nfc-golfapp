import { createServerFn } from '@tanstack/react-start'
import { getDb, type MutationResult } from './db'
import type { TeamMember } from '../../db/collections'

export const insertTeamMember = createServerFn({ method: 'POST' })
  .inputValidator((data: TeamMember) => data)
  .handler(async ({ data: teamMember }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [insertResult, txidResult] = await sql.transaction((txn) => [
      txn`
        INSERT INTO team_members (id, team_id, golfer_id, trip_id)
        VALUES (
          ${teamMember.id},
          ${teamMember.teamId},
          ${teamMember.golferId},
          ${teamMember.tripId}
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

export const deleteTeamMember = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [_deleteResult, txidResult] = await sql.transaction((txn) => [
      txn`DELETE FROM team_members WHERE id = ${id}`,
      txn`SELECT txid_current()::text AS txid`,
    ])

    return {
      id,
      txid: parseInt(txidResult[0].txid as string),
    }
  })
