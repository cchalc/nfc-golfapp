import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { wrapMutation, PermanentError } from '../../lib/errors'

/**
 * Get a Neon SQL client for server-side mutations.
 * Uses the serverless driver which supports transaction batching.
 */
export function getDb(): NeonQueryFunction<false, false> {
  return neon(process.env.DATABASE_URL!)
}

/**
 * Type for transaction result with txid.
 */
export type MutationResult<T> = T & { txid: number }

/**
 * Execute a mutation with idempotency key protection.
 * If the key was already processed, returns the cached result.
 * If the key is new, executes the mutation and stores the result.
 *
 * @param idempotencyKey - Unique key for this mutation (from offline executor)
 * @param operation - Name of the operation for error messages
 * @param fn - The mutation function to execute
 * @returns The mutation result
 */
export async function withIdempotency<T>(
  idempotencyKey: string | undefined,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  // If no idempotency key provided, execute directly
  if (!idempotencyKey) {
    return fn()
  }

  const sql = getDb()

  // Check if this key was already processed
  const existing = await sql`
    SELECT result FROM idempotency_keys WHERE key = ${idempotencyKey}
  `

  if (existing.length > 0 && existing[0].result) {
    // Return cached result
    return existing[0].result as T
  }

  // Try to claim the key
  const claimed = await sql`
    SELECT claim_idempotency_key(${idempotencyKey}) AS claimed
  `

  if (!claimed[0].claimed) {
    // Key was claimed by another request, wait briefly and check for result
    await new Promise((resolve) => setTimeout(resolve, 100))
    const result = await sql`
      SELECT result FROM idempotency_keys WHERE key = ${idempotencyKey}
    `
    if (result.length > 0 && result[0].result) {
      return result[0].result as T
    }
    // Still no result, throw to retry later
    throw new PermanentError(`${operation}: Duplicate request in progress`)
  }

  // We claimed the key, execute the mutation
  const result = await fn()

  // Store the result for future lookups
  await sql`
    UPDATE idempotency_keys
    SET result = ${JSON.stringify(result)}::jsonb
    WHERE key = ${idempotencyKey}
  `

  return result
}

// Re-export wrapMutation for use in mutation files
export { wrapMutation }
