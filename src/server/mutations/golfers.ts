import { createServerFn } from '@tanstack/react-start'
import { getDb, wrapMutation } from './db'
import type { Golfer } from '../../db/collections'
import { getSession } from '../auth/mutations'

type GolferInput = Omit<Golfer, 'createdAt'> & { createdAt?: Date }

// Helper to check if user can modify a golfer profile
async function requireGolferAccess(golferId: string): Promise<void> {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')

  // Users can only modify their own profile
  // (Admins adding golfers don't need auth - they create new records)
  if (session.golferId !== golferId) {
    throw new Error('Unauthorized: can only modify your own profile')
  }
}

export const insertGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: GolferInput) => data)
  .handler(async ({ data: golfer }): Promise<{ id: string }> => {
    // Insert is allowed - admins can create golfer profiles
    // The golfer will be linked to an identity when they log in
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
    // Check authorization - users can only update their own profile
    await requireGolferAccess(id)

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
    // Check authorization - users can only delete their own profile
    await requireGolferAccess(id)

    return wrapMutation('deleteGolfer', async () => {
      const sql = getDb()

      await sql`DELETE FROM golfers WHERE id = ${id}`

      return { id }
    })
  })
