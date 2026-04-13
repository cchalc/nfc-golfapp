import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import { getSession } from './mutations'
import { requireOrganizer } from './authorization'
import { generateInviteToken, INVITE_EXPIRY_MS } from './utils'

// ============================================================================
// Types
// ============================================================================

export interface TripInvite {
  id: string
  tripId: string
  token: string
  expiresAt: Date
  maxUses: number | null
  useCount: number
  createdAt: Date
}

export interface InviteInfo {
  valid: boolean
  tripId?: string
  tripName?: string
  expired?: boolean
  maxUsesReached?: boolean
}

// ============================================================================
// Create Trip Invite
// ============================================================================

export const createTripInvite = createServerFn({ method: 'POST' })
  .inputValidator((data: { tripId: string; maxUses?: number }) => data)
  .handler(
    async ({
      data: { tripId, maxUses },
    }): Promise<{ token: string; inviteUrl: string }> => {
      // Verify user is organizer
      await requireOrganizer({ data: { tripId } })

      const session = await getSession()
      if (!session) throw new Error('Not authenticated')

      const sql = getDb()
      const token = generateInviteToken()
      const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS)

      await sql`
        INSERT INTO trip_invites (trip_id, token, created_by, expires_at, max_uses)
        VALUES (${tripId}, ${token}, ${session.identityId}, ${expiresAt}, ${maxUses ?? null})
        RETURNING id
      `

      const baseUrl = process.env.APP_URL || 'http://localhost:5173'
      const inviteUrl = `${baseUrl}/invite/${token}`

      return {
        token,
        inviteUrl,
      }
    }
  )

// ============================================================================
// Get Invite Info (public - for invite page)
// ============================================================================

export const getInviteInfo = createServerFn({ method: 'GET' })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data: { token } }): Promise<InviteInfo> => {
    const sql = getDb()

    const invites = await sql`
      SELECT
        i.id,
        i.trip_id,
        i.expires_at,
        i.max_uses,
        i.use_count,
        t.name as trip_name
      FROM trip_invites i
      JOIN trips t ON i.trip_id = t.id
      WHERE i.token = ${token}
      LIMIT 1
    `

    if (invites.length === 0) {
      return { valid: false }
    }

    const invite = invites[0]
    const expiresAt = new Date(invite.expires_at as string)
    const maxUses = invite.max_uses as number | null
    const useCount = invite.use_count as number

    if (expiresAt < new Date()) {
      return { valid: false, expired: true }
    }

    if (maxUses !== null && useCount >= maxUses) {
      return { valid: false, maxUsesReached: true }
    }

    return {
      valid: true,
      tripId: invite.trip_id as string,
      tripName: invite.trip_name as string,
    }
  })

// ============================================================================
// Accept Trip Invite
// ============================================================================

export const acceptTripInvite = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string }) => data)
  .handler(
    async ({
      data: { token },
    }): Promise<{ tripId: string; success: boolean }> => {
      const session = await getSession()
      if (!session) throw new Error('Not authenticated')
      if (!session.golferId) throw new Error('No golfer profile linked')

      const sql = getDb()

      // Validate invite
      const invites = await sql`
        SELECT id, trip_id, expires_at, max_uses, use_count
        FROM trip_invites
        WHERE token = ${token}
        LIMIT 1
      `

      if (invites.length === 0) {
        throw new Error('Invalid invite link')
      }

      const invite = invites[0]
      const expiresAt = new Date(invite.expires_at as string)
      const maxUses = invite.max_uses as number | null
      const useCount = invite.use_count as number

      if (expiresAt < new Date()) {
        throw new Error('Invite link has expired')
      }

      if (maxUses !== null && useCount >= maxUses) {
        throw new Error('Invite link has reached maximum uses')
      }

      const tripId = invite.trip_id as string

      // Check if already a participant
      const existing = await sql`
        SELECT id FROM trip_golfers
        WHERE trip_id = ${tripId}
          AND golfer_id = ${session.golferId}
        LIMIT 1
      `

      if (existing.length > 0) {
        // Already a participant, just return success
        return {
          tripId,
          success: true,
        }
      }

      // Add to trip and increment use count
      await sql.transaction((txn) => [
        txn`
          INSERT INTO trip_golfers (trip_id, golfer_id, status, accepted_at)
          VALUES (${tripId}, ${session.golferId}, 'accepted', NOW())
        `,
        txn`
          UPDATE trip_invites
          SET use_count = use_count + 1
          WHERE id = ${invite.id}
        `,
      ])

      return {
        tripId,
        success: true,
      }
    }
  )

// ============================================================================
// List Trip Invites (for organizers)
// ============================================================================

export const listTripInvites = createServerFn({ method: 'GET' })
  .inputValidator((data: { tripId: string }) => data)
  .handler(async ({ data: { tripId } }): Promise<TripInvite[]> => {
    await requireOrganizer({ data: { tripId } })

    const sql = getDb()

    const invites = await sql`
      SELECT id, trip_id, token, expires_at, max_uses, use_count, created_at
      FROM trip_invites
      WHERE trip_id = ${tripId}
      ORDER BY created_at DESC
    `

    return invites.map((i) => ({
      id: i.id as string,
      tripId: i.trip_id as string,
      token: i.token as string,
      expiresAt: new Date(i.expires_at as string),
      maxUses: i.max_uses as number | null,
      useCount: i.use_count as number,
      createdAt: new Date(i.created_at as string),
    }))
  })

// ============================================================================
// Delete Trip Invite
// ============================================================================

export const deleteTripInvite = createServerFn({ method: 'POST' })
  .inputValidator((data: { tripId: string; inviteId: string }) => data)
  .handler(
    async ({
      data: { tripId, inviteId },
    }): Promise<{ success: boolean }> => {
      await requireOrganizer({ data: { tripId } })

      const sql = getDb()

      await sql`DELETE FROM trip_invites WHERE id = ${inviteId} AND trip_id = ${tripId}`

      return {
        success: true,
      }
    }
  )
