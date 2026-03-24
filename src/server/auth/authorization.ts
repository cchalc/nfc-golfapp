import { createServerFn } from '@tanstack/react-start'
import { getDb } from '../mutations/db'
import { getSession } from './mutations'

// ============================================================================
// Types
// ============================================================================

export type TripRole = 'owner' | 'organizer' | 'participant' | 'none'

export interface TripAccess {
  role: TripRole
  tripId: string
  identityId: string | null
  golferId: string | null
}

// ============================================================================
// Get Trip Role
// ============================================================================

export const getTripRole = createServerFn({ method: 'GET' })
  .inputValidator((data: { tripId: string }) => data)
  .handler(async ({ data: { tripId } }): Promise<TripAccess> => {
    const session = await getSession()

    if (!session) {
      return { role: 'none', tripId, identityId: null, golferId: null }
    }

    const sql = getDb()

    // Check if user is an organizer
    const organizers = await sql`
      SELECT role FROM trip_organizers
      WHERE trip_id = ${tripId}
        AND identity_id = ${session.identityId}
      LIMIT 1
    `

    if (organizers.length > 0) {
      return {
        role: organizers[0].role as TripRole,
        tripId,
        identityId: session.identityId,
        golferId: session.golferId,
      }
    }

    // Check if user is a participant (via trip_golfers)
    if (session.golferId) {
      const participants = await sql`
        SELECT id FROM trip_golfers
        WHERE trip_id = ${tripId}
          AND golfer_id = ${session.golferId}
        LIMIT 1
      `

      if (participants.length > 0) {
        return {
          role: 'participant',
          tripId,
          identityId: session.identityId,
          golferId: session.golferId,
        }
      }
    }

    return {
      role: 'none',
      tripId,
      identityId: session.identityId,
      golferId: session.golferId,
    }
  })

// ============================================================================
// Require Organizer (throws if not authorized)
// ============================================================================

export const requireOrganizer = createServerFn({ method: 'GET' })
  .inputValidator((data: { tripId: string }) => data)
  .handler(async ({ data: { tripId } }): Promise<TripAccess> => {
    const access = await getTripRole({ data: { tripId } })

    if (access.role !== 'owner' && access.role !== 'organizer') {
      throw new Error('Unauthorized: organizer access required')
    }

    return access
  })

// ============================================================================
// Require Trip Access (participant or higher)
// ============================================================================

export const requireTripAccess = createServerFn({ method: 'GET' })
  .inputValidator((data: { tripId: string }) => data)
  .handler(async ({ data: { tripId } }): Promise<TripAccess> => {
    const access = await getTripRole({ data: { tripId } })

    if (access.role === 'none') {
      throw new Error('Unauthorized: trip access required')
    }

    return access
  })

// ============================================================================
// Check if user can manage golfer scores
// ============================================================================

export const canManageGolferScores = createServerFn({ method: 'GET' })
  .inputValidator((data: { tripId: string; golferId: string }) => data)
  .handler(
    async ({ data: { tripId, golferId } }): Promise<{ allowed: boolean }> => {
      const access = await getTripRole({ data: { tripId } })

      // Organizers can manage all scores
      if (access.role === 'owner' || access.role === 'organizer') {
        return { allowed: true }
      }

      // Participants can only manage their own scores
      if (access.role === 'participant' && access.golferId === golferId) {
        return { allowed: true }
      }

      return { allowed: false }
    }
  )
