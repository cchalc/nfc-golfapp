import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { Challenge } from '../../db/collections'

export const insertChallenge = createServerFn({ method: 'POST' })
  .inputValidator((data: Challenge) => data)
  .handler(async ({ data: challenge }): Promise<{ id: string }> => {
    return wrapMutation('insertChallenge', async () => {
      const sql = getDb()

      const result = await sql`
        INSERT INTO challenges (id, trip_id, name, description, challenge_type, scope, round_id, hole_id, prize_description)
        VALUES (
          ${challenge.id},
          ${challenge.tripId},
          ${challenge.name},
          ${challenge.description},
          ${challenge.challengeType},
          ${challenge.scope},
          ${challenge.roundId},
          ${challenge.holeId},
          ${challenge.prizeDescription}
        )
        RETURNING id
      `

      return { id: result[0].id as string }
    })
  })

export const updateChallenge = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Challenge, 'id' | 'tripId'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    return wrapMutation('updateChallenge', async () => {
      const sql = getDb()

      await sql`
        UPDATE challenges
        SET name = COALESCE(${changes.name ?? null}, name),
            description = COALESCE(${changes.description ?? null}, description),
            challenge_type = COALESCE(${changes.challengeType ?? null}, challenge_type),
            scope = COALESCE(${changes.scope ?? null}, scope),
            round_id = COALESCE(${changes.roundId ?? null}, round_id),
            hole_id = COALESCE(${changes.holeId ?? null}, hole_id),
            prize_description = COALESCE(${changes.prizeDescription ?? null}, prize_description)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteChallenge = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteChallenge', async () => {
      const sql = getDb()

      await sql`DELETE FROM challenges WHERE id = ${id}`

      return { id }
    })
  })
