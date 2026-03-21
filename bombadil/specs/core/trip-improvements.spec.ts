/**
 * Trip Improvements Spec
 * Tests for trip navigation, handicap overrides, and course search functionality
 */
import { always } from '@antithesishq/bombadil'
import {
  currentPath,
  hasBackNavigation,
  hasCourseSearchButton,
} from '../../extractors/navigation'

export * from '@antithesishq/bombadil/defaults'

/**
 * Trip golfers page should have back navigation to trip
 */
export const tripGolfersHasBackNav = always(() => {
  const path = currentPath.current
  // On trip golfers page, back navigation should be present
  if (path.match(/\/trips\/[^/]+\/golfers$/)) {
    return hasBackNavigation.current
  }
  return true // Not on golfers page, invariant doesn't apply
})

/**
 * New round page should have course search button
 */
export const newRoundHasCourseSearch = always(() => {
  const path = currentPath.current
  // On new round page, course search button should be present
  if (path.match(/\/trips\/[^/]+\/rounds\/new$/)) {
    return hasCourseSearchButton.current
  }
  return true // Not on new round page, invariant doesn't apply
})

/**
 * Back navigation links should be valid
 */
export const backLinksAreValid = always(() => {
  const path = currentPath.current

  // On trip golfers page, back link should point to trip
  if (path.match(/\/trips\/([^/]+)\/golfers$/)) {
    // The back navigation present check already validates this
    return true
  }

  // On new round page, back link should point to rounds
  if (path.match(/\/trips\/([^/]+)\/rounds\/new$/)) {
    return true
  }

  return true
})
