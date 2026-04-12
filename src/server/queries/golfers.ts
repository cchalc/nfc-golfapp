import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import type { Golfer } from '../../db/collections'

export const getGolfers = createServerFn({ method: 'GET' }).handler(async (): Promise<Golfer[]> => {
  const sql = getDb()
  const rows = await sql`
    SELECT id, name, email, phone, handicap, profile_image_url, created_at
    FROM golfers
    ORDER BY name ASC
  `
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    handicap: (row.handicap as number) || 0,
    profileImageUrl: row.profile_image_url as string | null,
    createdAt: new Date(row.created_at as string),
  }))
})

export const getGolfer = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Golfer | null> => {
    const sql = getDb()
    const rows = await sql`
      SELECT id, name, email, phone, handicap, profile_image_url, created_at
      FROM golfers
      WHERE id = ${id}
    `
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      id: row.id as string,
      name: row.name as string,
      email: (row.email as string) || '',
      phone: (row.phone as string) || '',
      handicap: (row.handicap as number) || 0,
      profileImageUrl: row.profile_image_url as string | null,
      createdAt: new Date(row.created_at as string),
    }
  })
