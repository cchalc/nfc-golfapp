import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { wrapMutation } from '../../lib/errors'

/**
 * Get a Neon SQL client for server-side mutations.
 * Uses the serverless driver which supports transaction batching.
 */
export function getDb(): NeonQueryFunction<false, false> {
  return neon(process.env.DATABASE_URL!)
}

/**
 * Type for mutation result.
 */
export type MutationResult<T> = T

// Re-export wrapMutation for use in mutation files
export { wrapMutation }
