import { useState, useEffect } from 'react'
import { getTripRole, type TripRole, type TripAccess } from '../server/auth'

const tripRoleCache = new Map<string, TripAccess>()
const tripRoleInFlight = new Map<string, Promise<TripAccess>>()

/**
 * Hook to get the current user's role for a trip.
 *
 * @param tripId - The trip ID to check
 * @returns The trip access info with role
 */
export function useTripRole(tripId: string | undefined): {
  role: TripRole
  isLoading: boolean
  canManage: boolean
  access: TripAccess | null
} {
  const [access, setAccess] = useState<TripAccess | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!tripId) {
      setAccess(null)
      setIsLoading(false)
      return
    }

    const cached = tripRoleCache.get(tripId)
    if (cached) {
      setAccess(cached)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const inFlight =
      tripRoleInFlight.get(tripId) ??
      getTripRole({ data: { tripId } }).then((result) => {
        tripRoleCache.set(tripId, result)
        return result
      })

    tripRoleInFlight.set(tripId, inFlight)

    inFlight
      .then((result) => {
        setAccess(result)
      })
      .catch((error) => {
        console.error('[useTripRole] Error:', error)
        const fallback: TripAccess = {
          role: 'none',
          tripId,
          identityId: null,
          golferId: null,
        }
        tripRoleCache.set(tripId, fallback)
        setAccess(fallback)
      })
      .finally(() => {
        tripRoleInFlight.delete(tripId)
        setIsLoading(false)
      })
  }, [tripId])

  const role = access?.role ?? 'none'
  const canManage = role === 'owner' || role === 'organizer'

  return { role, isLoading, canManage, access }
}
