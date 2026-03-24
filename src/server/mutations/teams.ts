import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation, type MutationResult } from './db'
import type { Team } from '../../db/collections'

export const insertTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: Team) => data)
  .handler(async ({ data: team }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('insertTeam', async () => {
      const sql = getDb()

      const [insertResult, txidResult] = await sql.transaction((txn) => [
        txn`
          INSERT INTO teams (id, trip_id, name, color)
          VALUES (
            ${team.id},
            ${team.tripId},
            ${team.name},
            ${team.color}
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

export const updateTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Team, 'id' | 'tripId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('updateTeam', async () => {
      const sql = getDb()

      const [_updateResult, txidResult] = await sql.transaction((txn) => [
        txn`
          UPDATE teams
          SET name = COALESCE(${changes.name ?? null}, name),
              color = COALESCE(${changes.color ?? null}, color)
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

export const deleteTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    return wrapMutation('deleteTeam', async () => {
      const sql = getDb()

      const [_deleteResult, txidResult] = await sql.transaction((txn) => [
        txn`DELETE FROM teams WHERE id = ${id}`,
        txn`SELECT txid_current()::text AS txid`,
      ])

      return {
        id,
        txid: parseInt(txidResult[0].txid as string),
      }
    })
  })
