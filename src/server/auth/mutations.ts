import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import {
  generateMagicCode,
  generateSessionToken,
  createSessionCookie,
  clearSessionCookie,
  getSessionTokenFromRequest,
  getUserAgent,
  getClientIp,
  MAGIC_LINK_EXPIRY_MS,
  SESSION_EXPIRY_MS,
} from './utils'

// ============================================================================
// Types
// ============================================================================

export interface AuthSession {
  identityId: string
  golferId: string | null
  email: string
}

// ============================================================================
// Request Magic Link
// ============================================================================

export const requestMagicLink = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data: { email } }): Promise<{ success: boolean }> => {
    const sql = getDb()
    const normalizedEmail = email.toLowerCase().trim()

    // Generate code and expiry
    const code = generateMagicCode()
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS)

    // Delete any existing unused magic links for this email
    await sql`
      DELETE FROM magic_links
      WHERE email = ${normalizedEmail}
        AND used_at IS NULL
    `

    // Insert new magic link
    await sql`
      INSERT INTO magic_links (email, code, expires_at)
      VALUES (${normalizedEmail}, ${code}, ${expiresAt})
    `

    // Send email (or log to console in development)
    if (process.env.RESEND_API_KEY) {
      await sendMagicLinkEmail(normalizedEmail, code)
    } else {
      console.log(`[Magic Link] Code for ${normalizedEmail}: ${code}`)
    }

    return { success: true }
  })

// ============================================================================
// Verify Magic Link
// ============================================================================

export const verifyMagicLink = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; code: string }) => data)
  .handler(
    async ({
      data: { email, code },
    }): Promise<{
      success: boolean
      error?: string
      setCookie?: string
    }> => {
      const sql = getDb()
      const normalizedEmail = email.toLowerCase().trim()
      const normalizedCode = code.toUpperCase().trim()

      // Find valid magic link
      const links = await sql`
        SELECT id FROM magic_links
        WHERE email = ${normalizedEmail}
          AND code = ${normalizedCode}
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT 1
      `

      if (links.length === 0) {
        return { success: false, error: 'Invalid or expired code' }
      }

      // Mark magic link as used
      await sql`
        UPDATE magic_links
        SET used_at = NOW()
        WHERE id = ${links[0].id}
      `

      // Find or create identity
      let identities = await sql`
        SELECT id, golfer_id FROM identities WHERE email = ${normalizedEmail}
      `

      let identityId: string
      let golferId: string | null = null

      if (identities.length === 0) {
        // Check if there's a golfer with this email to auto-link
        const golfers = await sql`
          SELECT id, name FROM golfers
          WHERE LOWER(email) = ${normalizedEmail}
          LIMIT 1
        `

        if (golfers.length > 0) {
          golferId = golfers[0].id as string
        }

        // Create new identity
        const newIdentity = await sql`
          INSERT INTO identities (email, golfer_id, last_login_at)
          VALUES (${normalizedEmail}, ${golferId}, NOW())
          RETURNING id
        `
        identityId = newIdentity[0].id as string

        // If no existing golfer, create one with email as name
        if (!golferId) {
          const newGolfer = await sql`
            INSERT INTO golfers (name, email)
            VALUES (${normalizedEmail.split('@')[0]}, ${normalizedEmail})
            RETURNING id
          `
          golferId = newGolfer[0].id as string

          // Link golfer to identity
          await sql`
            UPDATE identities SET golfer_id = ${golferId} WHERE id = ${identityId}
          `
        }
      } else {
        identityId = identities[0].id as string
        golferId = identities[0].golfer_id as string | null

        // Update last login
        await sql`
          UPDATE identities SET last_login_at = NOW() WHERE id = ${identityId}
        `
      }

      // Create session
      const token = generateSessionToken()
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS)
      const userAgent = getUserAgent()
      const ipAddress = getClientIp()

      await sql`
        INSERT INTO sessions (identity_id, token, expires_at, last_active_at, user_agent, ip_address)
        VALUES (${identityId}, ${token}, ${expiresAt}, NOW(), ${userAgent}, ${ipAddress})
      `

      return {
        success: true,
        setCookie: createSessionCookie(token),
      }
    }
  )

// ============================================================================
// Get Session
// ============================================================================

export const getSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSession | null> => {
    const token = getSessionTokenFromRequest()
    if (!token) return null

    const sql = getDb()

    const sessions = await sql`
      SELECT
        s.id as session_id,
        s.expires_at,
        i.id as identity_id,
        i.email,
        i.golfer_id
      FROM sessions s
      JOIN identities i ON s.identity_id = i.id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
      LIMIT 1
    `

    if (sessions.length === 0) return null

    const session = sessions[0]

    // Update last active
    await sql`
      UPDATE sessions SET last_active_at = NOW() WHERE id = ${session.session_id}
    `

    return {
      identityId: session.identity_id as string,
      golferId: session.golfer_id as string | null,
      email: session.email as string,
    }
  }
)

// ============================================================================
// Logout
// ============================================================================

export const logout = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ success: boolean; setCookie: string }> => {
    const token = getSessionTokenFromRequest()

    if (token) {
      const sql = getDb()
      await sql`DELETE FROM sessions WHERE token = ${token}`
    }

    return {
      success: true,
      setCookie: clearSessionCookie(),
    }
  }
)

// ============================================================================
// Helper: Send Magic Link Email
// ============================================================================

async function sendMagicLinkEmail(email: string, code: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Golf Trip <noreply@golftrip.app>',
      to: email,
      subject: 'Your Golf Trip login code',
      html: `
        <h1>Your login code</h1>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: monospace;">
          ${code}
        </p>
        <p>This code expires in 15 minutes.</p>
        <p>If you didn't request this code, you can safely ignore this email.</p>
      `,
    }),
  })

  if (!response.ok) {
    console.error('[Email Error]', await response.text())
  }
}
