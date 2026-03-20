/**
 * State machine definitions for round scoring flow
 *
 * Models the valid state transitions during a round of golf.
 */
import { extract, type Cell } from '@antithesishq/bombadil'
import { holesWithScores, allHoleScores } from '../extractors/scoring'

/**
 * Round scoring states
 */
export type RoundScoringState =
  | 'no_scores' // No holes have scores entered
  | 'partial' // Some holes have scores
  | 'front_complete' // Holes 1-9 all have scores
  | 'back_complete' // Holes 10-18 all have scores
  | 'complete' // All 18 holes have scores

/**
 * Determine current round scoring state
 */
export const currentRoundState: Cell<RoundScoringState> = extract(() => {
  const scores = allHoleScores.current
  const totalHoles = scores.length

  if (totalHoles === 0) return 'no_scores'

  const withScores = holesWithScores.current

  if (withScores === 0) return 'no_scores'
  if (withScores === 18) return 'complete'

  // Check front/back nine completion
  const frontNineScores = scores
    .filter((s) => s.holeNumber <= 9)
    .filter((s) => s.grossScore !== null).length

  const backNineScores = scores
    .filter((s) => s.holeNumber >= 10)
    .filter((s) => s.grossScore !== null).length

  if (frontNineScores === 9 && backNineScores === 9) return 'complete'
  if (frontNineScores === 9) return 'front_complete'
  if (backNineScores === 9) return 'back_complete'

  return 'partial'
})

/**
 * Valid state transitions for round scoring
 *
 * This defines which transitions are allowed:
 * - no_scores -> partial (start entering scores)
 * - partial -> front_complete OR back_complete (finish a nine)
 * - front_complete -> complete (finish back nine)
 * - back_complete -> complete (finish front nine)
 * - Any state -> partial (clear some scores)
 * - partial -> no_scores (clear all scores)
 */
export const VALID_TRANSITIONS: Record<RoundScoringState, RoundScoringState[]> = {
  no_scores: ['partial', 'no_scores'],
  partial: ['no_scores', 'partial', 'front_complete', 'back_complete', 'complete'],
  front_complete: ['partial', 'complete', 'front_complete'],
  back_complete: ['partial', 'complete', 'back_complete'],
  complete: ['partial', 'front_complete', 'back_complete', 'complete'],
}

/**
 * Check if a transition is valid
 */
export function isValidTransition(
  from: RoundScoringState,
  to: RoundScoringState
): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

/**
 * Trip lifecycle states
 */
export type TripLifecycleState =
  | 'no_trips' // No trips exist
  | 'trip_created' // Trip created, no golfers
  | 'golfers_added' // Golfers invited to trip
  | 'course_selected' // Course chosen for a round
  | 'round_created' // Round created
  | 'scoring_started' // At least one score entered
  | 'round_complete' // All scores entered for a round

/**
 * Valid trip lifecycle transitions
 */
export const TRIP_LIFECYCLE_TRANSITIONS: Record<TripLifecycleState, TripLifecycleState[]> = {
  no_trips: ['trip_created', 'no_trips'],
  trip_created: ['golfers_added', 'trip_created', 'no_trips'],
  golfers_added: ['course_selected', 'golfers_added', 'trip_created'],
  course_selected: ['round_created', 'course_selected', 'golfers_added'],
  round_created: ['scoring_started', 'round_created', 'course_selected'],
  scoring_started: ['round_complete', 'scoring_started', 'round_created'],
  round_complete: ['scoring_started', 'round_complete', 'round_created'],
}
