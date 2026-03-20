/**
 * Navigation action generators for Bombadil specs
 *
 * These generators produce actions for Bombadil to explore navigation paths.
 */
import { actions, type Action, type ActionGenerator } from '@antithesishq/bombadil'
import { navLinks } from '../extractors/navigation'

/**
 * Generate navigation actions to internal links
 */
export const navigateToLinks: ActionGenerator = actions(() => {
  const links = navLinks.current
  const result: Action[] = []

  for (let i = 0; i < links.length && i < 5; i++) {
    // Use browser navigation actions
    result.push('Back')
    result.push('Forward')
  }

  // If no links, just wait
  if (result.length === 0) {
    result.push('Wait')
  }

  return result
})

/**
 * Generate browser navigation actions
 */
export const browserNavigation: ActionGenerator = actions(() => {
  const result: Action[] = [
    'Back',
    'Forward',
    'Reload',
    'Wait',
  ]
  return result
})

/**
 * Generate navigation to main routes
 */
export const navigateToMainRoutes: ActionGenerator = actions(() => {
  const result: Action[] = [
    'Back',
    'Forward',
    'Reload',
  ]
  return result
})

/**
 * Generate tab/section navigation clicks
 */
export const navigateToTabs: ActionGenerator = actions(() => {
  const result: Action[] = [
    'Wait',
    'Back',
  ]
  return result
})
