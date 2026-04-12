import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/trips/$tripId')({
  component: TripLayout,
})

/**
 * Trip Layout - Wraps all trip pages
 *
 * Simply passes through to child routes which fetch their own data
 * via TanStack Query hooks.
 */
function TripLayout() {
  return <Outlet />
}
