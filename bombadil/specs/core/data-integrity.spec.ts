/**
 * Core Data Integrity Invariants
 *
 * Quick property tests (<2 min) that verify data consistency
 * across the application. Run on every PR.
 */
import { always } from '@antithesishq/bombadil'
import { allHoleScores, frontNineTotals, backNineTotals } from '../../extractors/scoring'
import { leaderboardEntries, rankedEntries, ranksAreContiguous } from '../../extractors/leaderboard'

// Re-export defaults for standard checks
export * from '@antithesishq/bombadil/defaults'

/**
 * INVARIANT: Front Nine Total Matches Sum
 * Front nine total must equal sum of holes 1-9
 */
export const frontNineTotalCorrect = always(() => {
  const totals = frontNineTotals.current
  if (totals.gross === null) return true // No totals displayed yet

  const scores = allHoleScores.current.filter((s) => s.holeNumber <= 9)
  const enteredScores = scores.filter((s) => s.grossScore !== null)

  if (enteredScores.length === 0) return true

  const sumGross = enteredScores.reduce((sum, s) => sum + (s.grossScore ?? 0), 0)
  const sumNet = enteredScores.reduce((sum, s) => sum + (s.netScore ?? 0), 0)
  const sumStableford = enteredScores.reduce((sum, s) => sum + (s.stablefordPoints ?? 0), 0)

  // Totals should match
  if (totals.gross !== null && totals.gross !== sumGross) return false
  if (totals.net !== null && totals.net !== sumNet) return false
  if (totals.stableford !== null && totals.stableford !== sumStableford) return false

  return true
})

/**
 * INVARIANT: Back Nine Total Matches Sum
 * Back nine total must equal sum of holes 10-18
 */
export const backNineTotalCorrect = always(() => {
  const totals = backNineTotals.current
  if (totals.gross === null) return true // No totals displayed yet

  const scores = allHoleScores.current.filter((s) => s.holeNumber >= 10)
  const enteredScores = scores.filter((s) => s.grossScore !== null)

  if (enteredScores.length === 0) return true

  const sumGross = enteredScores.reduce((sum, s) => sum + (s.grossScore ?? 0), 0)
  const sumNet = enteredScores.reduce((sum, s) => sum + (s.netScore ?? 0), 0)
  const sumStableford = enteredScores.reduce((sum, s) => sum + (s.stablefordPoints ?? 0), 0)

  // Totals should match
  if (totals.gross !== null && totals.gross !== sumGross) return false
  if (totals.net !== null && totals.net !== sumNet) return false
  if (totals.stableford !== null && totals.stableford !== sumStableford) return false

  return true
})

/**
 * INVARIANT: Leaderboard Sorted
 * Entries with ranks must be in ascending order by rank
 */
export const leaderboardSorted = always(() => {
  const ranked = rankedEntries.current
  if (ranked.length <= 1) return true

  for (let i = 0; i < ranked.length - 1; i++) {
    const currentRank = ranked[i].rank as number
    const nextRank = ranked[i + 1].rank as number
    // Next rank should be >= current (allows ties)
    if (nextRank < currentRank) return false
  }

  return true
})

/**
 * INVARIANT: Tied Ranks Consistent
 * Golfers with the same score value should have the same rank
 */
export const tiedRanksConsistent = always(() => {
  const entries = leaderboardEntries.current
  const rankedWithValues = entries.filter((e) => e.rank !== null && e.scoreValue)

  // Group by score value
  const byValue = new Map<string, number[]>()
  for (const entry of rankedWithValues) {
    const ranks = byValue.get(entry.scoreValue) || []
    ranks.push(entry.rank as number)
    byValue.set(entry.scoreValue, ranks)
  }

  // All entries with same value should have same rank
  for (const ranks of byValue.values()) {
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
 * INVARIANT: Leader Has Best Value
 * Rank 1 should have the best score (highest for Stableford, lowest for Net)
 */
export const leaderHasBestValue = always(() => {
  const entries = rankedEntries.current
  if (entries.length <= 1) return true

  const leader = entries.find((e) => e.rank === 1)
  if (!leader) return true // No leader yet

  const leaderValue = parseFloat(leader.scoreValue) || 0

  // Check all other ranked entries
  for (const entry of entries) {
    if (entry.rank === 1) continue

    const entryValue = parseFloat(entry.scoreValue) || 0

    // For Stableford (higher is better), leader should have highest value
    // This is a heuristic - we assume Stableford if values look like points (0-50ish)
    if (leaderValue <= 50) {
      // Likely Stableford
      if (entryValue > leaderValue) return false
    } else {
      // Likely gross/net (lower is better)
      if (entryValue < leaderValue) return false
    }
  }

  return true
})

/**
 * INVARIANT: Ranks Are Contiguous
 * Ranks should not have gaps (1, 2, 2, 4 is ok; 1, 2, 4 is not)
 */
export const ranksContiguous = always(() => {
  return ranksAreContiguous.current
})

/**
 * INVARIANT: Hole Numbers Unique
 * Each hole number should appear only once on the scorecard
 */
export const holeNumbersUnique = always(() => {
  const scores = allHoleScores.current
  const seen = new Set<number>()

  for (const score of scores) {
    if (seen.has(score.holeNumber)) {
      return false
    }
    seen.add(score.holeNumber)
  }

  return true
})

/**
 * INVARIANT: Hole Numbers Sequential
 * Holes should be numbered 1-18 without gaps
 */
export const holeNumbersSequential = always(() => {
  const scores = allHoleScores.current
  if (scores.length === 0) return true

  const holeNumbers = scores.map((s) => s.holeNumber).sort((a, b) => a - b)

  // Should start at 1
  if (holeNumbers[0] !== 1) return false

  // Each subsequent hole should be previous + 1
  for (let i = 1; i < holeNumbers.length; i++) {
    if (holeNumbers[i] !== holeNumbers[i - 1] + 1) {
      return false
    }
  }

  return true
})
