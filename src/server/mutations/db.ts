import { neon, NeonQueryFunction } from '@neondatabase/serverless'

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
