import { createServerFn } from '@tanstack/react-start'
import { getDb, type MutationResult } from './db'
import type { Golfer } from '../../db/collections'

type GolferInput = Omit<Golfer, 'createdAt'> & { createdAt?: Date }

export const insertGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: GolferInput) => data)
  .handler(async ({ data: golfer }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [insertResult, txidResult] = await sql.transaction((txn) => [
      txn`
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
      `,
      txn`SELECT txid_current()::text AS txid`,
    ])

    return {
      id: insertResult[0].id as string,
      txid: parseInt(txidResult[0].txid as string),
    }
  })

export const updateGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Omit<Golfer, 'id' | 'createdAt'>> }) => data)
  .handler(async ({ data: { id, changes } }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [_updateResult, txidResult] = await sql.transaction((txn) => [
      txn`
        UPDATE golfers
        SET name = COALESCE(${changes.name ?? null}, name),
            email = COALESCE(${changes.email ?? null}, email),
            phone = COALESCE(${changes.phone ?? null}, phone),
            handicap = COALESCE(${changes.handicap ?? null}, handicap),
            profile_image_url = COALESCE(${changes.profileImageUrl ?? null}, profile_image_url)
        WHERE id = ${id}
      `,
      txn`SELECT txid_current()::text AS txid`,
    ])

    return {
      id,
      txid: parseInt(txidResult[0].txid as string),
    }
  })

export const deleteGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data: { id } }): Promise<MutationResult<{ id: string }>> => {
    const sql = getDb()

    const [_deleteResult, txidResult] = await sql.transaction((txn) => [
      txn`DELETE FROM golfers WHERE id = ${id}`,
      txn`SELECT txid_current()::text AS txid`,
    ])

    return {
      id,
      txid: parseInt(txidResult[0].txid as string),
    }
  })
