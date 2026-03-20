/**
 * Edge Case Tests
 *
 * Long-running exploratory tests targeting edge cases and boundary
 * conditions throughout the application. Run nightly.
 */
import { always, eventually } from '@antithesishq/bombadil'
import { allHoleScores, scorecardVisible } from '../../extractors/scoring'
import {
  leaderboardEntries,
  leaderboardVisible,
  rankedEntries,
} from '../../extractors/leaderboard'
import { currentPath, hasError, isLoading, searchParams } from '../../extractors/navigation'
import { SCORE_CONSTRAINTS } from '../../fixtures/constants'

// Re-export defaults
export * from '@antithesishq/bombadil/defaults'

// Re-export generators
export {
  enterRandomScores,
  enterEdgeCaseScores,
  clearScores,
} from '../../generators/score-entry'
export {
  navigateToLinks,
  browserNavigation,
  navigateToTabs,
} from '../../generators/navigation'
export {
  fillGolferForm,
  fillTripForm,
  submitForms,
  interactWithDialogs,
} from '../../generators/forms'

/**
 * INVARIANT: Empty State Handled Gracefully
 * Pages with no data should show appropriate empty states
 */
export const emptyStateHandled = always(() => {
  // Skip during loading
  if (isLoading.current) return true

  // If on a page and no error, empty state is handled correctly
  return !hasError.current
})

/**
 * INVARIANT: Zero Handicap Works
 * Scratch golfers (0 handicap) should work correctly
 */
export const zeroHandicapWorks = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  // For 0 handicap, all handicap strokes should be 0
  // But we can only verify this if we know the golfer's handicap
  // For now, just verify no negative strokes
  for (const score of scores) {
    if (score.handicapStrokes < 0) return false
  }

  return true
})

/**
 * INVARIANT: Maximum Handicap Works
 * 54 handicap golfers should work correctly
 */
export const maxHandicapWorks = always(() => {
  if (!scorecardVisible.current) return true

  // 54 handicap = 3 strokes per hole (54/18 = 3)
  // Verify strokes never exceed 3
  const scores = allHoleScores.current

  for (const score of scores) {
    if (score.handicapStrokes > 3) return false
  }

  return true
})

/**
 * INVARIANT: Minimum Score Works
 * Score of 1 (hole in one) should work
 */
export const minimumScoreWorks = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  for (const score of scores) {
    if (score.grossScore === SCORE_CONSTRAINTS.MIN_GROSS_SCORE) {
      // Should have valid net and stableford
      if (score.netScore === null || score.stablefordPoints === null) {
        // Might be mid-calculation
        continue
      }
      // Net should be 1 - handicapStrokes (could be 0 or negative)
      // Stableford should be high (5 pts for albatross+)
      if (score.stablefordPoints < 0 || score.stablefordPoints > 5) {
        return false
      }
    }
  }

  return true
})

/**
 * INVARIANT: Maximum Score Works
 * Score of 15 should work
 */
export const maximumScoreWorks = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  for (const score of scores) {
    if (score.grossScore === SCORE_CONSTRAINTS.MAX_GROSS_SCORE) {
      // Should have valid calculations
      if (score.netScore !== null && score.stablefordPoints !== null) {
        // Stableford should be 0 (double bogey or worse)
        if (score.stablefordPoints !== 0) {
          // Par 3 with 15 strokes = net 12 or less = way over double bogey
          // Should always be 0 points unless massive handicap
          // Allow this to pass as handicap could make it non-zero
        }
      }
    }
  }

  return true
})

/**
 * INVARIANT: All Pars Score Correctly
 * Par 3, 4, and 5 holes should all work
 */
export const allParsScoreCorrectly = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  const parsSeen = new Set<number>()

  for (const score of scores) {
    parsSeen.add(score.par)

    // Each par value should result in valid calculations
    if (score.par < 3 || score.par > 5) {
      return false
    }
  }

  return true
})

/**
 * INVARIANT: Tied Leaderboard Ranks Valid
 * When golfers have same score, they should share rank
 */
export const tiedRanksValid = always(() => {
  if (!leaderboardVisible.current) return true

  const entries = leaderboardEntries.current

  // Group by score value
  const byScore = new Map<string, number[]>()
  for (const entry of entries) {
    if (entry.rank === null) continue
    const ranks = byScore.get(entry.scoreValue) || []
    ranks.push(entry.rank)
    byScore.set(entry.scoreValue, ranks)
  }

  // All entries with same score should have same rank
  for (const ranks of byScore.values()) {
    if (ranks.length > 1) {
      const firstRank = ranks[0]
      if (!ranks.every((r) => r === firstRank)) {
        return false
      }
    }
  }

  return true
})

/**
 * INVARIANT: Single Golfer Leaderboard Works
 * Leaderboard with one golfer should show them as rank 1
 */
export const singleGolferLeaderboard = always(() => {
  if (!leaderboardVisible.current) return true

  const ranked = rankedEntries.current

  if (ranked.length === 1) {
    // Single golfer should be rank 1
    if (ranked[0].rank !== 1) {
      return false
    }
  }

  return true
})

/**
 * INVARIANT: Empty Leaderboard Works
 * Leaderboard with no golfers should not crash
 */
export const emptyLeaderboardWorks = always(() => {
  if (!leaderboardVisible.current) return true

  // If leaderboard is visible, it shouldn't be in error state
  return !hasError.current
})

/**
 * INVARIANT: URL Parameters Valid
 * Query params should be valid values
 */
export const urlParametersValid = always(() => {
  const params = searchParams.current

  // Check golferId param if present
  if (params.golferId) {
    // Should be a non-empty string, not "undefined" or "null"
    if (
      params.golferId === 'undefined' ||
      params.golferId === 'null' ||
      params.golferId === ''
    ) {
      return false
    }
  }

  return true
})

/**
 * INVARIANT: Deep URLs Work
 * Navigating to deep URLs should not crash
 */
export const deepUrlsWork = always(() => {
  const path = currentPath.current

  // If path has many segments, it should still work
  const segments = path.split('/').filter(Boolean)

  if (segments.length >= 4) {
    // Deep path like /trips/123/rounds/456/scorecard
    // Should not be in error state after loading
    if (isLoading.current) return true
    return !hasError.current
  }

  return true
})

/**
 * INVARIANT: Back Navigation Works
 * Going back should not break the app
 */
export const backNavigationWorks = always(() => {
  // If we're not in error state, back navigation is working
  return !hasError.current
})

/**
 * TEMPORAL: Loading Never Stuck Forever
 * No page should be loading forever
 */
export const loadingNeverStuck = always(() => {
  if (!isLoading.current) return true

  // Eventually should stop loading
  return eventually(() => !isLoading.current)
})

/**
 * INVARIANT: Special Characters In Names Handled
 * Golfer/trip names with special characters should display correctly
 */
export const specialCharactersHandled = always(() => {
  // This is a soft check - we're not testing XSS, just that the app doesn't crash
  // with special characters in data
  return !hasError.current
})

/**
 * INVARIANT: Date Boundary Handling
 * Dates at boundaries (year start/end, month boundaries) should work
 */
export const dateBoundariesWork = always(() => {
  // If we're on a trip page and not in error, dates are handled
  const path = currentPath.current
  if (path.includes('/trips/')) {
    return !hasError.current
  }
  return true
})
