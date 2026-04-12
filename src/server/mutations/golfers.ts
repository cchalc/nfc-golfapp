import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { Golfer } from '../../db/collections'

type GolferInput = Omit<Golfer, 'createdAt'> & { createdAt?: Date }

export const insertGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: GolferInput) => data)
  .handler(async ({ data: golfer }): Promise<{ id: string }> => {
    return wrapMutation('insertGolfer', async () => {
      const sql = getDb()

      const result = await sql`
        INSERT INTO golfers (id, name, email, phone, handicap, profile_image_url, created_at)
        VALUES (
          ${golfer.id},
          ${golfer.name},
          ${golfer.email},
          ${golfer.phone},
          ${golfer.handicap},
          ${golfer.profileImageUrl},
          ${golfer.createdAt ?? new Date()}
        )
        RETURNING id
      `

      return { id: result[0].id as string }
    })
  })

export const updateGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Golfer, 'id' | 'createdAt'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<{ id: string }> => {
    return wrapMutation('updateGolfer', async () => {
      const sql = getDb()

      await sql`
        UPDATE golfers
        SET name = COALESCE(${changes.name ?? null}, name),
            email = COALESCE(${changes.email ?? null}, email),
            phone = COALESCE(${changes.phone ?? null}, phone),
            handicap = COALESCE(${changes.handicap ?? null}, handicap),
            profile_image_url = COALESCE(${changes.profileImageUrl ?? null}, profile_image_url)
        WHERE id = ${id}
      `

      return { id }
    })
  })

export const deleteGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<{ id: string }> => {
    return wrapMutation('deleteGolfer', async () => {
      const sql = getDb()

      await sql`DELETE FROM golfers WHERE id = ${id}`

      return { id }
    })
  })
