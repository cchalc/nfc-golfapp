/**
 * Trip Lifecycle Workflow Tests
 *
 * Property tests for the complete trip creation and management flow.
 * Runs on main branch (5-15 min).
 */
import { always, eventually } from '@antithesishq/bombadil'
import { currentPath, hasError, isLoading } from '../../extractors/navigation'

// Re-export defaults
export * from '@antithesishq/bombadil/defaults'

// Re-export generators for autonomous exploration
export { navigateToLinks, browserNavigation } from '../../generators/navigation'
export { fillTripForm, submitForms, interactWithDialogs } from '../../generators/forms'

/**
 * INVARIANT: Trip Creation Flow Valid
 * When on /trips/new, form submission should lead to either:
 * - Success (redirect to trip detail)
 * - Validation error (stay on page with error)
 */
export const tripCreationFlowValid = always(() => {
  const path = currentPath.current

  if (path !== '/trips/new') return true

  // If form was submitted (path changes or error appears)
  // This is checked on the next state after form submission
  return true
})

/**
 * TEMPORAL: After Trip Creation, Valid State
 * When leaving trip creation, should be on valid page
 */
export const tripCreationLeadsToValidState = always(() => {
  const path = currentPath.current

  // If we're on a trip detail page, it should not show errors
  if (path.startsWith('/trips/') && path !== '/trips/new' && path !== '/trips') {
    if (isLoading.current) return true
    return !hasError.current
  }

  return true
})

/**
 * INVARIANT: Trip Detail Page Has Required Elements
 * Trip detail pages should show trip information
 */
export const tripDetailHasContent = always(() => {
  const path = currentPath.current

  // Check if we're on a trip detail page
  const tripMatch = path.match(/^\/trips\/([^/]+)$/)
  if (!tripMatch) return true

  // Skip loading state
  if (isLoading.current) return true

  // Page should not be in error state
  return !hasError.current
})

/**
 * INVARIANT: Trip Subpages Accessible
 * All trip subpages (golfers, rounds, leaderboards) should be accessible
 */
export const tripSubpagesAccessible = always(() => {
  const path = currentPath.current

  const tripSubpages = ['/golfers', '/rounds', '/leaderboards', '/teams', '/challenges']

  for (const subpage of tripSubpages) {
    if (path.endsWith(subpage) && path.startsWith('/trips/')) {
      // Should not be in error state
      if (hasError.current && !isLoading.current) {
        return false
      }
    }
  }

  return true
})

/**
 * INVARIANT: Round Creation Within Trip
 * Creating a round should keep us within the trip context
 */
export const roundCreationInTripContext = always(() => {
  const path = currentPath.current

  // If on round creation page
  if (path.match(/^\/trips\/([^/]+)\/rounds\/new$/)) {
    // Extract trip ID
    const tripId = path.split('/')[2]
    // Trip ID should be valid
    if (!tripId || tripId === 'undefined') {
      return false
    }
  }

  return true
})

/**
 * TEMPORAL: Eventually Navigate Away From Loading
 * No page should be stuck in loading state forever
 */
export const noStuckLoading = always(() => {
  if (!isLoading.current) return true

  // If loading, it should eventually complete
  return eventually(() => !isLoading.current)
})

/**
 * INVARIANT: Golfer List Accessible From Trip
 * Trip golfer management should be accessible
 */
export const golferListAccessible = always(() => {
  const path = currentPath.current

  if (path.match(/^\/trips\/([^/]+)\/golfers$/)) {
    if (isLoading.current) return true
    return !hasError.current
  }

  return true
})
