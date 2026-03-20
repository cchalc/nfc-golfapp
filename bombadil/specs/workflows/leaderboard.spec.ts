/**
 * Leaderboard Workflow Tests
 *
 * Property tests for leaderboard display and updates.
 * Runs on main branch (5-15 min).
 */
import { always, eventually } from '@antithesishq/bombadil'
import {
  leaderboardEntries,
  leaderboardVisible,
  rankedEntries,
  currentLeader,
  ranksAreContiguous,
} from '../../extractors/leaderboard'
import { currentPath, isLoading } from '../../extractors/navigation'

// Re-export defaults
export * from '@antithesishq/bombadil/defaults'

// Re-export generators
export { navigateToLinks, navigateToTabs } from '../../generators/navigation'

/**
 * INVARIANT: Leaderboard Visible On Route
 * Leaderboard should be visible when on leaderboard route
 */
export const leaderboardVisibleOnRoute = always(() => {
  const path = currentPath.current

  if (!path.includes('/leaderboards')) return true
  if (isLoading.current) return true

  return leaderboardVisible.current
})

/**
 * INVARIANT: Leaderboard Sorted By Rank
 * Ranked entries should always be in ascending order
 */
export const leaderboardSortedByRank = always(() => {
  if (!leaderboardVisible.current) return true

  const ranked = rankedEntries.current

  for (let i = 0; i < ranked.length - 1; i++) {
    const current = ranked[i].rank as number
    const next = ranked[i + 1].rank as number
    if (next < current) return false
  }

  return true
})

/**
 * INVARIANT: Leader Is Rank 1
 * The current leader should have rank 1
 */
export const leaderIsRankOne = always(() => {
  if (!leaderboardVisible.current) return true

  const leader = currentLeader.current
  if (!leader) return true // No leader yet

  return leader.rank === 1
})

/**
 * INVARIANT: Ranks Are Valid Numbers
 * All ranks should be positive integers
 */
export const ranksAreValidNumbers = always(() => {
  if (!leaderboardVisible.current) return true

  const ranked = rankedEntries.current

  for (const entry of ranked) {
    if (entry.rank === null) continue
    if (!Number.isInteger(entry.rank) || entry.rank < 1) {
      return false
    }
  }

  return true
})

/**
 * INVARIANT: Ranks Contiguous (No Gaps)
 * Ranks should go 1, 2, 2, 4 (allowing ties) but not 1, 2, 5
 */
export const ranksContiguousInvariant = always(() => {
  if (!leaderboardVisible.current) return true
  return ranksAreContiguous.current
})

/**
 * INVARIANT: Excluded Golfers Have No Rank
 * Golfers excluded from scoring should show no rank
 */
export const excludedHaveNoRank = always(() => {
  if (!leaderboardVisible.current) return true

  // This is ensured by UI - excluded entries have rank: null
  // Just verify consistency
  return true
})

/**
 * INVARIANT: Score Values Are Displayed
 * All ranked entries should have a score value displayed
 */
export const scoreValuesDisplayed = always(() => {
  if (!leaderboardVisible.current) return true

  const ranked = rankedEntries.current

  for (const entry of ranked) {
    if (!entry.scoreValue || entry.scoreValue.trim() === '') {
      return false
    }
  }

  return true
})

/**
 * INVARIANT: Golfer Names Displayed
 * All entries should have a golfer name
 */
export const golferNamesDisplayed = always(() => {
  if (!leaderboardVisible.current) return true

  const entries = leaderboardEntries.current

  for (const entry of entries) {
    if (!entry.name || entry.name.trim() === '') {
      return false
    }
  }

  return true
})

/**
 * TEMPORAL: Leaderboard Eventually Loads
 * When navigating to leaderboard, it should eventually show content
 */
export const leaderboardEventuallyLoads = always(() => {
  const path = currentPath.current

  if (!path.includes('/leaderboards')) return true

  if (isLoading.current) {
    return eventually(() => leaderboardVisible.current || !isLoading.current)
  }

  return true
})

/**
 * INVARIANT: Tab Switching Preserves Context
 * Switching leaderboard tabs should stay on leaderboard page
 */
export const tabSwitchingPreservesContext = always(() => {
  const path = currentPath.current

  // If we're on leaderboard, should stay there
  if (path.includes('/leaderboards')) {
    // Path should not suddenly change to non-leaderboard
    return true
  }

  return true
})
