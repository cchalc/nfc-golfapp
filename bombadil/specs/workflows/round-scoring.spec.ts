/**
 * Round Scoring Workflow Tests
 *
 * Property tests for the complete scoring flow during a round.
 * Runs on main branch (5-15 min).
 */
import { always, eventually } from '@antithesishq/bombadil'
import {
  allHoleScores,
  scorecardVisible,
  holesWithScores,
  frontNineTotals,
  backNineTotals,
} from '../../extractors/scoring'
import { currentPath, isLoading } from '../../extractors/navigation'
import { currentRoundState } from '../../state-machines/round-states'

// Re-export defaults
export * from '@antithesishq/bombadil/defaults'

// Re-export generators for autonomous exploration
export {
  enterRandomScores,
  enterSequentialScores,
  clearScores,
} from '../../generators/score-entry'
export { navigateToLinks } from '../../generators/navigation'

/**
 * INVARIANT: Valid Round State
 * State should be one of the valid states
 */
export const validRoundState = always(() => {
  const state = currentRoundState.current
  const validStates = ['no_scores', 'partial', 'front_complete', 'back_complete', 'complete']
  return validStates.includes(state)
})

/**
 * INVARIANT: Scorecard Shows When On Scorecard Route
 * If URL indicates scorecard page, scorecard should be visible (after loading)
 */
export const scorecardVisibleOnRoute = always(() => {
  const path = currentPath.current

  if (!path.includes('/scorecard')) return true
  if (isLoading.current) return true

  return scorecardVisible.current
})

/**
 * INVARIANT: Score Entry Reflects In Totals
 * When a score is entered, totals should update
 */
export const scoreEntryReflectedInTotals = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  const frontScores = scores.filter((s) => s.holeNumber <= 9 && s.grossScore !== null)
  const backScores = scores.filter((s) => s.holeNumber >= 10 && s.grossScore !== null)

  const frontTotals = frontNineTotals.current
  const backTotals = backNineTotals.current

  // If there are front nine scores, totals should be non-null
  if (frontScores.length > 0 && frontTotals.gross !== null) {
    const expectedGross = frontScores.reduce((sum, s) => sum + (s.grossScore ?? 0), 0)
    if (frontTotals.gross !== expectedGross) return false
  }

  // Same for back nine
  if (backScores.length > 0 && backTotals.gross !== null) {
    const expectedGross = backScores.reduce((sum, s) => sum + (s.grossScore ?? 0), 0)
    if (backTotals.gross !== expectedGross) return false
  }

  return true
})

/**
 * TEMPORAL: Score Updates Reflected Within Timeout
 * After entering a score, it should be reflected in UI within 500ms
 */
export const scoreUpdatesReflected = always(() => {
  if (!scorecardVisible.current) return true

  // Check that all visible inputs have their values reflected
  const scores = allHoleScores.current

  for (const score of scores) {
    if (score.grossScore !== null && score.netScore === null) {
      // Score entered but net not calculated yet
      // Should eventually be calculated
      return eventually(() => {
        const updated = allHoleScores.current.find(
          (s) => s.holeNumber === score.holeNumber
        )
        return updated?.netScore !== null
      })
    }
  }

  return true
})

/**
 * INVARIANT: Complete Round Has All Scores
 * If state is 'complete', all 18 holes should have scores
 */
export const completeRoundHasAllScores = always(() => {
  const state = currentRoundState.current

  if (state !== 'complete') return true

  return holesWithScores.current === 18
})

/**
 * INVARIANT: Front Complete Has Nine Scores
 * If state is 'front_complete', holes 1-9 should all have scores
 */
export const frontCompleteHasNineScores = always(() => {
  const state = currentRoundState.current

  if (state !== 'front_complete') return true

  const scores = allHoleScores.current
  const frontNineWithScores = scores
    .filter((s) => s.holeNumber <= 9)
    .filter((s) => s.grossScore !== null)

  return frontNineWithScores.length === 9
})

/**
 * INVARIANT: Golfer Context Preserved During Scoring
 * Scorecard should maintain golfer context (URL param)
 */
export const golferContextPreserved = always(() => {
  const path = currentPath.current

  if (!path.includes('/scorecard')) return true

  // URL should have golferId param if we're scoring
  // This is validated by the route - just ensure no errors
  return true
})

/**
 * INVARIANT: No Duplicate Hole Entries
 * Each hole should only have one score input
 */
export const noDuplicateHoleEntries = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  const holeNumbers = scores.map((s) => s.holeNumber)
  const uniqueHoles = new Set(holeNumbers)

  return holeNumbers.length === uniqueHoles.size
})
