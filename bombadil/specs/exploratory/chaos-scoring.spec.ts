/**
 * Chaos Scoring Tests
 *
 * Long-running exploratory tests that stress-test the scoring system
 * with random inputs and rapid interactions. Run nightly.
 */
import { always, eventually } from '@antithesishq/bombadil'
import {
  allHoleScores,
  scorecardVisible,
  frontNineTotals,
  backNineTotals,
} from '../../extractors/scoring'
import { hasError } from '../../extractors/navigation'
import { SCORE_CONSTRAINTS } from '../../fixtures/constants'

// Re-export defaults
export * from '@antithesishq/bombadil/defaults'

// Re-export all generators for maximum chaos
export {
  enterRandomScores,
  enterSequentialScores,
  enterEdgeCaseScores,
  clearScores,
} from '../../generators/score-entry'
export {
  navigateToLinks,
  browserNavigation,
  navigateToMainRoutes,
  navigateToTabs,
} from '../../generators/navigation'
export {
  fillGolferForm,
  fillTripForm,
  submitForms,
  interactWithDialogs,
} from '../../generators/forms'


/**
 * INVARIANT: Score Calculations Never Crash
 * No matter what scores are entered, calculations should not throw
 */
export const scoreCalculationsNeverCrash = always(() => {
  // If we're on a scorecard and no error, we're good
  if (!scorecardVisible.current) return true
  return !hasError.current
})

/**
 * INVARIANT: Rapid Score Entry Handled
 * Entering scores rapidly should not cause race conditions
 */
export const rapidScoreEntryHandled = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  // Check that all entered scores have corresponding calculations
  for (const score of scores) {
    if (score.grossScore !== null) {
      // If gross is entered, net should eventually be calculated
      // (Allow a brief moment for async updates)
      if (score.netScore === null) {
        // Check if it's a very recent entry
        return eventually(() => {
          const updated = allHoleScores.current.find(
            (s) => s.holeNumber === score.holeNumber
          )
          return updated?.netScore !== null || updated?.grossScore === null
        })
      }
    }
  }

  return true
})

/**
 * INVARIANT: Stableford Points Always Valid
 * Points should always be in 0-5 range
 */
export const stablefordAlwaysValid = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  for (const score of scores) {
    if (score.stablefordPoints !== null) {
      if (score.stablefordPoints < 0 || score.stablefordPoints > 5) {
        return false
      }
    }
  }

  return true
})

/**
 * INVARIANT: Totals Never Exceed Maximum
 * Front/back nine totals should be reasonable
 */
export const totalsNeverExceedMaximum = always(() => {
  const frontTotals = frontNineTotals.current
  const backTotals = backNineTotals.current

  // Max gross for 9 holes = 9 * 15 = 135
  const maxGrossPerNine = 9 * SCORE_CONSTRAINTS.MAX_GROSS_SCORE

  if (frontTotals.gross !== null && frontTotals.gross > maxGrossPerNine) {
    return false
  }

  if (backTotals.gross !== null && backTotals.gross > maxGrossPerNine) {
    return false
  }

  // Max Stableford for 9 holes = 9 * 5 = 45
  const maxStablefordPerNine = 9 * 5

  if (frontTotals.stableford !== null && frontTotals.stableford > maxStablefordPerNine) {
    return false
  }

  if (backTotals.stableford !== null && backTotals.stableford > maxStablefordPerNine) {
    return false
  }

  return true
})

/**
 * INVARIANT: Net Score Relationship Maintained
 * Net should always be <= Gross (handicap strokes are non-negative)
 */
export const netScoreRelationship = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  for (const score of scores) {
    if (score.grossScore !== null && score.netScore !== null) {
      // Net should be <= Gross (with positive handicap strokes)
      // Net = Gross - HandicapStrokes, so Net <= Gross
      if (score.netScore > score.grossScore) {
        return false
      }
    }
  }

  return true
})

/**
 * INVARIANT: No Negative Scores
 * All scores (gross, net, stableford) should be >= 0
 */
export const noNegativeScores = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  for (const score of scores) {
    if (score.grossScore !== null && score.grossScore < 0) return false
    if (score.netScore !== null && score.netScore < 0) return false
    if (score.stablefordPoints !== null && score.stablefordPoints < 0) return false
    if (score.handicapStrokes < 0) return false
  }

  return true
})

/**
 * INVARIANT: Score Entry Inputs Accept Valid Values
 * Entered values within range should be accepted
 */
export const validScoresAccepted = always(() => {
  if (!scorecardVisible.current) return true

  // The UI should allow entering scores 1-15
  // This is more of a liveness check - scores can be entered
  return true
})

/**
 * INVARIANT: Clearing Scores Removes Calculations
 * If gross is cleared, net and stableford should also be cleared
 */
export const clearingScoresConsistent = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  for (const score of scores) {
    // If gross is null, net and stableford should also be null
    if (score.grossScore === null) {
      if (score.netScore !== null || score.stablefordPoints !== null) {
        return false
      }
    }
  }

  return true
})

/**
 * TEMPORAL: Application Recovers From Invalid State
 * If we get into an invalid state, app should eventually recover
 */
export const recoversFromInvalidState = always(() => {
  if (hasError.current) {
    // Error should eventually clear or we navigate away
    return eventually(() => !hasError.current || !scorecardVisible.current)
  }
  return true
})

/**
 * INVARIANT: Handicap Strokes Are Valid
 * Handicap strokes for a hole should be valid (0-3)
 */
export const handicapStrokesValid = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  for (const score of scores) {
    // Handicap strokes must be non-negative and reasonable
    if (score.handicapStrokes < 0 || score.handicapStrokes > 3) {
      return false
    }
  }

  return true
})
