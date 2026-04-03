import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TripDataPreloader } from '../../components/TripDataPreloader'

export const Route = createFileRoute('/trips/$tripId')({
  component: TripLayout,
})

/**
 * Trip Layout - Wraps all trip pages with data preloader
 *
 * This layout component eagerly loads all trip-related data when mounting,
 * ensuring instant access for all child pages (rounds, leaderboards, etc.)
 */
function TripLayout() {
  const { tripId } = Route.useParams()

  return (
    <TripDataPreloader tripId={tripId}>
      <Outlet />
    </TripDataPreloader>
  )
}
