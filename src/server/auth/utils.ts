import { getRequest, getCookie } from '@tanstack/react-start/server'
import crypto from 'node:crypto'

// Characters without ambiguous glyphs (no I, O, 0, 1, l)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Generate a 6-character magic link code.
 * Uses cryptographically secure random bytes.
 */
export function generateMagicCode(): string {
  const bytes = crypto.randomBytes(6)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length]
  }
  return code
}

/**
 * Generate a secure session token (32 bytes = 256 bits).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Generate a secure invite token (16 bytes = 128 bits).
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(16).toString('base64url')
}

/**
 * Cookie configuration for session token.
 */
export const SESSION_COOKIE_NAME = 'golf_session'
export const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * Create Set-Cookie header value for session.
 */
export function createSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; ${secure}SameSite=Lax; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}`
}

/**
 * Create Set-Cookie header value to clear session.
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

/**
 * Parse session token from request cookies.
 */
export function getSessionTokenFromRequest(): string | null {
  try {
    return getCookie(SESSION_COOKIE_NAME) || null
  } catch {
    return null
  }
}

/**
 * Get user agent from request.
 */
export function getUserAgent(): string | null {
  try {
    const request = getRequest()
    return request.headers.get('user-agent') ?? null
  } catch {
    return null
  }
}

/**
 * Get client IP address from request.
 */
export function getClientIp(): string | null {
  let request: Request
  try {
    request = getRequest()
  } catch {
    return null
  }

  // Check common proxy headers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return null
}

/**
 * Magic link expiry time (15 minutes).
 */
export const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000

/**
 * Session expiry time (30 days).
 */
export const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Invite link expiry time (7 days).
 */
export const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000
