/**
 * Leaderboard state extractors for Bombadil specs
 */
import { extract } from '@antithesishq/bombadil'

// Leaderboard entry structure
export interface LeaderboardEntryData {
  golferId: string
  rank: number | null
  name: string
  scoreValue: string
}

// Extract all leaderboard entries
export const leaderboardEntries = extract((state) => {
  const entries: {
    golferId: string
    rank: number | null
    name: string
    scoreValue: string
  }[] = []
  const rows = state.document.querySelectorAll('[data-testid^="leaderboard-row-"]')

  rows.forEach((row) => {
    const testId = row.getAttribute('data-testid')
    const golferId = testId?.replace('leaderboard-row-', '') || ''

    const rankEl = state.document.querySelector(`[data-testid="rank-${golferId}"]`)
    const nameEl = state.document.querySelector(`[data-testid="golfer-name-${golferId}"]`)
    const scoreEl = state.document.querySelector(`[data-testid="score-value-${golferId}"]`)

    const rankText = rankEl?.textContent?.trim()
    const rank = rankText ? parseInt(rankText, 10) : null

    entries.push({
      golferId,
      rank: isNaN(rank as number) ? null : rank,
      name: nameEl?.textContent?.trim() || '',
      scoreValue: scoreEl?.textContent?.trim() || '',
    })
  })

  return entries
})

// Check if leaderboard is visible
export const leaderboardVisible = extract((state) => {
  const body = state.document.querySelector('[data-testid="leaderboard-body"]')
  return body !== null
})

// Get the current leader (rank 1)
export const currentLeader = extract((_state) => {
  const entries = leaderboardEntries.current
  const leader = entries.find((e) => e.rank === 1)
  return leader || null
})

// Get entries sorted by rank (excluded entries have null rank)
export const rankedEntries = extract((_state) => {
  const entries = leaderboardEntries.current
  return entries
    .filter((e) => e.rank !== null)
    .sort((a, b) => (a.rank as number) - (b.rank as number))
})

// Check if ranks are contiguous (no gaps)
export const ranksAreContiguous = extract((_state) => {
  const ranked = rankedEntries.current
  if (ranked.length === 0) return true

  for (let i = 0; i < ranked.length - 1; i++) {
    const currentRank = ranked[i].rank as number
    const nextRank = ranked[i + 1].rank as number
    // Allow ties (same rank) or increment by 1
    if (nextRank !== currentRank && nextRank !== currentRank + 1) {
      return false
    }
  }
  return true
})

// Count total entries (included + excluded)
export const totalEntries = extract((_state) => {
  return leaderboardEntries.current.length
})

// Count ranked entries (those with a rank)
export const rankedCount = extract((_state) => {
  return leaderboardEntries.current.filter((e) => e.rank !== null).length
})
