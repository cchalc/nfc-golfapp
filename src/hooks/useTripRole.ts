import { useState, useEffect } from 'react'
import { getTripRole, type TripRole, type TripAccess } from '../server/auth'

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

    setIsLoading(true)

    getTripRole({ data: { tripId } })
      .then((result) => {
        setAccess(result)
      })
      .catch((error) => {
        console.error('[useTripRole] Error:', error)
        setAccess({
          role: 'none',
          tripId,
          identityId: null,
          golferId: null,
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [tripId])

  const role = access?.role ?? 'none'
  const canManage = role === 'owner' || role === 'organizer'

  return { role, isLoading, canManage, access }
}
