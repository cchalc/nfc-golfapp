/**
 * Score entry action generators for Bombadil specs
 *
 * These generators produce actions for entering scores on the scorecard.
 */
import { actions, type Action, type ActionGenerator } from '@antithesishq/bombadil'
import { allHoleScores, scorecardVisible } from '../extractors/scoring'

/**
 * Generate random valid score entry actions
 */
export const enterRandomScores: ActionGenerator = actions(() => {
  if (!scorecardVisible.current) {
    return ['Wait'] as Action[]
  }

  const result: Action[] = []
  const scores = allHoleScores.current

  for (const score of scores) {
    // Generate TypeText action for a random score
    const minScore = Math.max(1, score.par - 2)
    const maxScore = Math.min(15, score.par + 4)
    const randomScore = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore

    result.push({
      TypeText: {
        text: randomScore.toString(),
        delayMillis: 50,
      },
    })
  }

  if (result.length === 0) {
    return ['Wait'] as Action[]
  }

  return result
})

/**
 * Generate score entry for specific holes (edge cases)
 */
export const enterEdgeCaseScores: ActionGenerator = actions(() => {
  if (!scorecardVisible.current) {
    return ['Wait'] as Action[]
  }

  // Edge case scores to test
  const edgeScores = [1, 2, 10, 15]
  const result: Action[] = []

  for (const edgeScore of edgeScores) {
    result.push({
      TypeText: {
        text: edgeScore.toString(),
        delayMillis: 50,
      },
    })
  }

  return result
})

/**
 * Generate score clearing actions
 */
export const clearScores: ActionGenerator = actions(() => {
  if (!scorecardVisible.current) {
    return ['Wait'] as Action[]
  }

  // Press Backspace to clear scores
  const result: Action[] = [
    { PressKey: { code: 8 } }, // Backspace
    { PressKey: { code: 46 } }, // Delete
    'Wait',
  ]
  return result
})

/**
 * Generate sequential score entry (hole by hole)
 */
export const enterSequentialScores: ActionGenerator = actions(() => {
  if (!scorecardVisible.current) {
    return ['Wait'] as Action[]
  }

  const scores = allHoleScores.current

  // Find first hole without a score
  const nextHole = scores.find((s) => s.grossScore === null)
  if (!nextHole) {
    return ['Wait'] as Action[]
  }

  // Enter a par-ish score
  const variance = Math.floor(Math.random() * 3) - 1 // -1, 0, or 1
  const score = Math.max(1, Math.min(15, nextHole.par + variance))

  const result: Action[] = [
    {
      TypeText: {
        text: score.toString(),
        delayMillis: 100,
      },
    },
    { PressKey: { code: 9 } }, // Tab to next field
  ]

  return result
})
