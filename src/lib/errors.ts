/**
 * Error classes for mutation error handling.
 *
 * Errors are classified as either:
 * - Retriable: Network issues, timeouts, temporary failures (will be retried)
 * - Permanent: Validation errors, constraint violations, auth failures (won't retry)
 */

/**
 * Error that can be retried (network issues, timeouts, server overload)
 */
export class RetriableError extends Error {
  readonly isRetriable = true
  readonly originalError: unknown

  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = 'RetriableError'
    this.originalError = originalError
  }
}

/**
 * Error that should not be retried (validation, constraints, auth)
 */
export class PermanentError extends Error {
  readonly isRetriable = false
  readonly originalError: unknown

  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = 'PermanentError'
    this.originalError = originalError
  }
}

/**
 * Check if an error is retriable based on its type and characteristics.
 *
 * Retriable errors include:
 * - Network failures (fetch errors, connection reset)
 * - Timeouts
 * - Server errors (5xx status codes)
 * - Rate limiting (429)
 * - Serialization conflicts (Postgres 40001)
 *
 * Permanent errors include:
 * - Constraint violations (Postgres 23xxx)
 * - Authorization failures (401, 403)
 * - Not found (404)
 * - Validation errors (400)
 * - Unique violations (Postgres 23505)
 */
export function isRetriable(error: unknown): boolean {
  // Already classified errors
  if (error instanceof RetriableError) return true
  if (error instanceof PermanentError) return false

  // String errors
  if (typeof error === 'string') {
    const lower = error.toLowerCase()
    return (
      lower.includes('network') ||
      lower.includes('timeout') ||
      lower.includes('econnreset') ||
      lower.includes('econnrefused') ||
      lower.includes('socket hang up')
    )
  }

  // Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up') ||
      message.includes('aborted')
    ) {
      return true
    }

    // Postgres errors (from Neon)
    // 23xxx = constraint violations (permanent)
    // 40001 = serialization failure (retriable)
    // 40P01 = deadlock (retriable)
    // 57xxx = operator intervention (retriable)
    // 53xxx = insufficient resources (retriable)
    const pgCodeMatch = message.match(/code[:\s]*"?(\d{5}|\d{2}[A-Z]\d{2})"?/i)
    if (pgCodeMatch) {
      const code = pgCodeMatch[1]
      // Constraint violations are permanent
      if (code.startsWith('23')) return false
      // Serialization/deadlock are retriable
      if (code === '40001' || code === '40P01') return true
      // Resource/operator issues are retriable
      if (code.startsWith('53') || code.startsWith('57')) return true
    }

    // HTTP-like status codes in error
    const statusMatch = message.match(/status[:\s]*(\d{3})/i)
    if (statusMatch) {
      const status = parseInt(statusMatch[1])
      // 5xx and 429 are retriable
      if (status >= 500 || status === 429) return true
      // 4xx (except 429) are permanent
      if (status >= 400) return false
    }
  }

  // Default: assume retriable for safety (don't lose data)
  return true
}

/**
 * Wrap a mutation handler with error classification.
 */
export function wrapMutation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return fn().catch((error) => {
    if (isRetriable(error)) {
      throw new RetriableError(`${operation} failed (retriable)`, error)
    }
    throw new PermanentError(`${operation} failed`, error)
  })
}
