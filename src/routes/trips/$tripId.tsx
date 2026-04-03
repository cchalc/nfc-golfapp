import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TripDataProvider } from '../../contexts/TripDataContext'

export const Route = createFileRoute('/trips/$tripId')({
  component: TripLayout,
})

/**
 * Trip Layout - Wraps all trip pages with trip-scoped data context
 *
 * Provides trip-scoped Electric SQL collections to all child pages:
 * - 99% data reduction via server-side WHERE clauses
 * - Sub-100ms sync latency with immediate mode
 * - Automatic cleanup on unmount
 *
 * All child pages access data via useTripData() hook.
 */
function TripLayout() {
  const { tripId } = Route.useParams()

  return (
    <TripDataProvider tripId={tripId}>
      <Outlet />
    </TripDataProvider>
  )
}
