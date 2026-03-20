/**
 * Core Navigation Invariants
 *
 * Quick property tests (<2 min) that verify navigation
 * works correctly. Run on every PR.
 */
import { always, eventually } from '@antithesishq/bombadil'
import {
  currentPath,
  isLoading,
  hasError,
  navLinks,
  visibleHeadings,
} from '../../extractors/navigation'
import { ROUTES } from '../../fixtures/constants'

// Re-export defaults for standard checks
export * from '@antithesishq/bombadil/defaults'

/**
 * INVARIANT: Valid Path Format
 * Current path must start with /
 */
export const validPathFormat = always(() => {
  const path = currentPath.current
  return path.startsWith('/')
})

/**
 * INVARIANT: No Error State During Normal Navigation
 * Error boundary should not be showing during normal use
 * (Note: This is a soft invariant - errors can occur but should be rare)
 */
export const noUnexpectedErrors = always(() => {
  // Allow errors on specific paths (e.g., 404 pages)
  const path = currentPath.current
  if (path.includes('/not-found') || path.includes('/error')) {
    return true
  }
  return !hasError.current
})

/**
 * INVARIANT: Page Has Heading
 * Every page should have at least one heading for accessibility
 */
export const pageHasHeading = always(() => {
  // Skip check while loading
  if (isLoading.current) return true

  const headings = visibleHeadings.current
  return headings.length > 0
})

/**
 * INVARIANT: Internal Links Valid
 * All internal links should have valid href attributes
 */
export const internalLinksValid = always(() => {
  const links = navLinks.current
  for (const link of links) {
    // Skip external links
    if (link.startsWith('http')) continue
    // Internal links must start with /
    if (!link.startsWith('/')) return false
    // No double slashes
    if (link.includes('//')) return false
  }
  return true
})

/**
 * TEMPORAL: Loading Eventually Completes
 * If page is loading, it should eventually finish
 */
export const loadingEventuallyCompletes = always(() => {
  if (!isLoading.current) return true

  return eventually(() => !isLoading.current)
})

/**
 * INVARIANT: Known Routes Accessible
 * Standard routes should not show errors
 */
export const knownRoutesAccessible = always(() => {
  const path = currentPath.current
  const knownRoutes = Object.values(ROUTES)

  // If we're on a known route, there shouldn't be an error
  if (knownRoutes.includes(path as (typeof knownRoutes)[number])) {
    return !hasError.current
  }

  return true
})

/**
 * INVARIANT: Trip Route Structure
 * Trip-related routes must follow expected pattern
 */
export const tripRouteStructure = always(() => {
  const path = currentPath.current

  // If this is a trip route, verify structure
  if (path.startsWith('/trips/') && path !== '/trips/new') {
    // Should have trip ID segment
    const segments = path.split('/').filter(Boolean)
    if (segments.length >= 2) {
      const tripId = segments[1]
      // Trip ID should be a UUID-like string (not empty, not a reserved word)
      if (tripId === '' || tripId === 'undefined' || tripId === 'null') {
        return false
      }
    }
  }

  return true
})

/**
 * INVARIANT: Round Route Has Trip
 * Accessing a round route should have a valid trip context
 */
export const roundRouteHasTrip = always(() => {
  const path = currentPath.current

  // Pattern: /trips/:tripId/rounds/:roundId
  const roundMatch = path.match(/^\/trips\/([^/]+)\/rounds\/([^/]+)/)
  if (roundMatch) {
    const [, tripId, roundId] = roundMatch
    // Both IDs should be non-empty and not placeholders
    if (!tripId || tripId === ':tripId' || !roundId || roundId === ':roundId') {
      return false
    }
  }

  return true
})
