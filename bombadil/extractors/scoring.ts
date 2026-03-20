/**
 * Scoring state extractors for Bombadil specs
 *
 * These extractors query the DOM for scoring-related data
 * using data-testid attributes added to components.
 */
import { extract } from '@antithesishq/bombadil'

// Score entry element structure
export interface HoleScoreData {
  holeNumber: number
  par: number
  grossScore: number | null
  netScore: number | null
  stablefordPoints: number | null
  handicapStrokes: number
}

// Extract all hole scores currently visible on the scorecard
export const allHoleScores = extract((state) => {
  const scores: {
    holeNumber: number
    par: number
    grossScore: number | null
    netScore: number | null
    stablefordPoints: number | null
    handicapStrokes: number
  }[] = []

  for (let i = 1; i <= 18; i++) {
    const entryEl = state.document.querySelector(`[data-testid="score-entry-hole-${i}"]`)
    if (!entryEl) continue

    const parEl = state.document.querySelector(`[data-testid="hole-par-${i}"]`)
    const grossEl = state.document.querySelector(
      `[data-testid="gross-score-${i}"]`
    ) as HTMLInputElement | null
    const netEl = state.document.querySelector(`[data-testid="net-score-${i}"]`)
    const stablefordEl = state.document.querySelector(`[data-testid="stableford-points-${i}"]`)
    const handicapEl = state.document.querySelector(`[data-testid="handicap-strokes-${i}"]`)

    const parText = parEl?.textContent?.match(/Par (\d)/)?.[1]
    const par = parText ? parseInt(parText, 10) : 4

    const grossValue = grossEl?.value
    const grossScore = grossValue ? parseInt(grossValue, 10) : null

    const netText = netEl?.textContent
    const netScore = netText ? parseInt(netText, 10) : null

    const stablefordText = stablefordEl?.textContent?.match(/(\d+) pts/)?.[1]
    const stablefordPoints = stablefordText ? parseInt(stablefordText, 10) : null

    const handicapText = handicapEl?.textContent?.match(/\+(\d)/)?.[1]
    const handicapStrokes = handicapText ? parseInt(handicapText, 10) : 0

    scores.push({
      holeNumber: i,
      par,
      grossScore,
      netScore,
      stablefordPoints,
      handicapStrokes,
    })
  }

  return scores
})

// Extract front nine totals
export const frontNineTotals = extract((state) => {
  const grossEl = state.document.querySelector('[data-testid="front-nine-gross"]')
  const netEl = state.document.querySelector('[data-testid="front-nine-net"]')
  const stablefordEl = state.document.querySelector('[data-testid="front-nine-stableford"]')

  const parseTotal = (el: Element | null): number | null => {
    if (!el) return null
    const text = el.textContent
    if (!text || text.includes('-')) return null
    const match = text.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  return {
    gross: parseTotal(grossEl),
    net: parseTotal(netEl),
    stableford: parseTotal(stablefordEl),
  }
})

// Extract back nine totals
export const backNineTotals = extract((state) => {
  const grossEl = state.document.querySelector('[data-testid="back-nine-gross"]')
  const netEl = state.document.querySelector('[data-testid="back-nine-net"]')
  const stablefordEl = state.document.querySelector('[data-testid="back-nine-stableford"]')

  const parseTotal = (el: Element | null): number | null => {
    if (!el) return null
    const text = el.textContent
    if (!text || text.includes('-')) return null
    const match = text.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  return {
    gross: parseTotal(grossEl),
    net: parseTotal(netEl),
    stableford: parseTotal(stablefordEl),
  }
})

// Check if scorecard is visible
export const scorecardVisible = extract((state) => {
  const frontNine = state.document.querySelector('[data-testid="front-nine"]')
  const backNine = state.document.querySelector('[data-testid="back-nine"]')
  return frontNine !== null || backNine !== null
})

// Count holes with entered scores
export const holesWithScores = extract((state) => {
  let count = 0
  for (let i = 1; i <= 18; i++) {
    const grossEl = state.document.querySelector(
      `[data-testid="gross-score-${i}"]`
    ) as HTMLInputElement | null
    if (grossEl?.value && !isNaN(parseInt(grossEl.value, 10))) {
      count++
    }
  }
  return count
})
