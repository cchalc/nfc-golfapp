/**
 * Core Scoring Invariants
 *
 * Quick property tests (<2 min) that verify scoring calculations
 * remain correct under all conditions. Run on every PR.
 */
import { always } from '@antithesishq/bombadil'
import { allHoleScores, scorecardVisible } from '../../extractors/scoring'
import { SCORE_CONSTRAINTS, STABLEFORD_POINTS } from '../../fixtures/constants'

// Re-export defaults for standard checks (uncaught exceptions, etc.)
export * from '@antithesishq/bombadil/defaults'

/**
 * INVARIANT: Net Score Calculation
 * Net score must always equal gross score minus handicap strokes
 */
export const netScoreCalculation = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  for (const score of scores) {
    if (score.grossScore === null || score.netScore === null) continue

    const expectedNet = score.grossScore - score.handicapStrokes
    if (score.netScore !== expectedNet) {
      return false
    }
  }
  return true
})

/**
 * INVARIANT: Stableford Points Correct
 * Points must follow the standard mapping based on net score vs par
 */
export const stablefordPointsCorrect = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  for (const score of scores) {
    if (score.netScore === null || score.stablefordPoints === null) continue

    const diff = score.netScore - score.par
    let expectedPoints: number

    if (diff >= 2) expectedPoints = STABLEFORD_POINTS.DOUBLE_BOGEY_OR_WORSE
    else if (diff === 1) expectedPoints = STABLEFORD_POINTS.BOGEY
    else if (diff === 0) expectedPoints = STABLEFORD_POINTS.PAR
    else if (diff === -1) expectedPoints = STABLEFORD_POINTS.BIRDIE
    else if (diff === -2) expectedPoints = STABLEFORD_POINTS.EAGLE
    else expectedPoints = STABLEFORD_POINTS.ALBATROSS

    if (score.stablefordPoints !== expectedPoints) {
      return false
    }
  }
  return true
})

/**
 * INVARIANT: Handicap Strokes Valid
 * Strokes must be >= 0 and typically <= 3 per hole
 */
export const handicapStrokesValid = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  for (const score of scores) {
    // Handicap strokes must be non-negative
    if (score.handicapStrokes < 0) return false
    // With max handicap 54, max strokes per hole is 3 (54/18 = 3)
    if (score.handicapStrokes > 3) return false
  }
  return true
})

/**
 * INVARIANT: Gross Score Range
 * All gross scores must be within valid range (1-15)
 */
export const grossScoreRange = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  for (const score of scores) {
    if (score.grossScore === null) continue

    if (
      score.grossScore < SCORE_CONSTRAINTS.MIN_GROSS_SCORE ||
      score.grossScore > SCORE_CONSTRAINTS.MAX_GROSS_SCORE
    ) {
      return false
    }
  }
  return true
})

/**
 * INVARIANT: Par Values Valid
 * All par values must be 3, 4, or 5
 */
export const parValuesValid = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  for (const score of scores) {
    if (
      score.par < SCORE_CONSTRAINTS.MIN_PAR ||
      score.par > SCORE_CONSTRAINTS.MAX_PAR
    ) {
      return false
    }
  }
  return true
})

/**
 * INVARIANT: Stableford Points Non-Negative
 * Stableford points must always be 0-5
 */
export const stablefordPointsRange = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current
  for (const score of scores) {
    if (score.stablefordPoints === null) continue
    if (score.stablefordPoints < 0 || score.stablefordPoints > 5) {
      return false
    }
  }
  return true
})

/**
 * INVARIANT: Net Score Consistent With Formula
 * Net = Gross - HandicapStrokes for all holes with scores
 */
export const netScoreConsistent = always(() => {
  if (!scorecardVisible.current) return true

  const scores = allHoleScores.current

  for (const score of scores) {
    if (score.grossScore !== null && score.netScore !== null) {
      // Net should equal gross minus handicap strokes
      const expectedNet = score.grossScore - score.handicapStrokes
      if (score.netScore !== expectedNet) {
        return false
      }
    }
  }

  return true
})
