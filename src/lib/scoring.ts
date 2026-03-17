import type { Hole, Score } from '../db/collections'

/**
 * Calculate handicap strokes for a given hole based on playing handicap
 *
 * - Handicap 1-18: 1 stroke on holes where SI <= handicap
 * - Handicap 19-36: 2 strokes on holes where SI <= (handicap - 18), 1 stroke on others
 * - Handicap 37+: 3 strokes on some holes, etc.
 */
export function getHandicapStrokes(
  strokeIndex: number,
  playingHandicap: number
): number {
  if (playingHandicap <= 0) return 0

  // How many "rounds" of strokes we've distributed
  const fullRounds = Math.floor(playingHandicap / 18)
  const remainder = playingHandicap % 18

  // Base strokes from full rounds
  let strokes = fullRounds

  // Additional stroke if this hole's SI is within the remainder
  if (strokeIndex <= remainder) {
    strokes += 1
  }

  return strokes
}

/**
 * Calculate net score (gross - handicap strokes)
 */
export function calculateNetScore(
  grossScore: number,
  handicapStrokes: number
): number {
  return grossScore - handicapStrokes
}

/**
 * Calculate Stableford points based on net score vs par
 *
 * Net double bogey+: 0 pts
 * Net bogey: 1 pt
 * Net par: 2 pts
 * Net birdie: 3 pts
 * Net eagle: 4 pts
 * Net albatross: 5 pts
 */
export function calculateStablefordPoints(
  netScore: number,
  par: number
): number {
  const diff = netScore - par

  if (diff >= 2) return 0 // Double bogey or worse
  if (diff === 1) return 1 // Bogey
  if (diff === 0) return 2 // Par
  if (diff === -1) return 3 // Birdie
  if (diff === -2) return 4 // Eagle
  if (diff <= -3) return 5 // Albatross or better

  return 0
}

/**
 * Check if a net score is birdie or better
 */
export function isBirdieOrBetter(netScore: number, par: number): boolean {
  return netScore <= par - 1
}

/**
 * Calculate all scoring data for a single hole
 */
export function calculateHoleScore(
  grossScore: number,
  hole: Pick<Hole, 'par' | 'strokeIndex'>,
  playingHandicap: number
): {
  grossScore: number
  handicapStrokes: number
  netScore: number
  stablefordPoints: number
} {
  const handicapStrokes = getHandicapStrokes(hole.strokeIndex, playingHandicap)
  const netScore = calculateNetScore(grossScore, handicapStrokes)
  const stablefordPoints = calculateStablefordPoints(netScore, hole.par)

  return {
    grossScore,
    handicapStrokes,
    netScore,
    stablefordPoints,
  }
}

/**
 * Calculate round summary from individual hole scores
 */
export function calculateRoundSummary(
  scores: Array<Pick<Score, 'grossScore' | 'netScore' | 'stablefordPoints'>>,
  holes: Array<Pick<Hole, 'par'>>
): {
  totalGross: number
  totalNet: number
  totalStableford: number
  birdiesOrBetter: number
} {
  const totalGross = scores.reduce((sum, s) => sum + s.grossScore, 0)
  const totalNet = scores.reduce((sum, s) => sum + s.netScore, 0)
  const totalStableford = scores.reduce((sum, s) => sum + s.stablefordPoints, 0)

  // Count birdies or better
  const birdiesOrBetter = scores.filter((score, idx) => {
    const hole = holes[idx]
    return hole && isBirdieOrBetter(score.netScore, hole.par)
  }).length

  return {
    totalGross,
    totalNet,
    totalStableford,
    birdiesOrBetter,
  }
}

/**
 * Calculate course handicap from handicap index
 * Course Handicap = Handicap Index × (Slope Rating / 113)
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number
): number {
  return Math.round(handicapIndex * (slopeRating / 113))
}

/**
 * Calculate playing handicap (course handicap adjusted for course rating)
 * Playing Handicap = Course Handicap + (Course Rating - Par)
 */
export function calculatePlayingHandicap(
  courseHandicap: number,
  courseRating: number | null,
  par: number
): number {
  if (courseRating === null) return courseHandicap
  return Math.round(courseHandicap + (courseRating - par))
}

/**
 * Get a full playing handicap from raw inputs
 */
export function getPlayingHandicap(
  handicapIndex: number,
  slopeRating: number | null,
  courseRating: number | null,
  par: number
): number {
  // If no slope, just use handicap index directly
  const slope = slopeRating ?? 113
  const courseHandicap = calculateCourseHandicap(handicapIndex, slope)
  return calculatePlayingHandicap(courseHandicap, courseRating, par)
}
