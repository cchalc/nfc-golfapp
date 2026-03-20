import { describe, it, expect } from 'vitest'
import {
  getHandicapStrokes,
  calculateNetScore,
  calculateStablefordPoints,
  isBirdieOrBetter,
  calculateHoleScore,
  calculateRoundSummary,
  calculateCourseHandicap,
  calculatePlayingHandicap,
  getPlayingHandicap,
} from '../../../src/lib/scoring'
import {
  createHole,
  createHoles18,
  createScore,
  createRoundScores,
  HANDICAP_TEST_CASES,
  STABLEFORD_POINTS,
  STANDARD_SLOPE,
} from '../../fixtures/factories'

describe('getHandicapStrokes', () => {
  describe('zero handicap', () => {
    it('returns 0 strokes for handicap 0 on any hole', () => {
      for (let si = 1; si <= 18; si++) {
        expect(getHandicapStrokes(si, 0)).toBe(0)
      }
    })

    it('returns 0 strokes for negative handicap', () => {
      expect(getHandicapStrokes(1, -5)).toBe(0)
    })
  })

  describe('handicap 1-18 (one round of strokes)', () => {
    it('gives 1 stroke on SI 1 for handicap 1', () => {
      expect(getHandicapStrokes(1, 1)).toBe(1)
      expect(getHandicapStrokes(2, 1)).toBe(0)
    })

    it('gives 1 stroke on all holes for handicap 18', () => {
      for (let si = 1; si <= 18; si++) {
        expect(getHandicapStrokes(si, 18)).toBe(1)
      }
    })

    it('gives 1 stroke on SI <= handicap', () => {
      const handicap = 10
      for (let si = 1; si <= 18; si++) {
        const expected = si <= handicap ? 1 : 0
        expect(getHandicapStrokes(si, handicap)).toBe(expected)
      }
    })
  })

  describe('handicap 19-36 (two rounds of strokes)', () => {
    it('gives 2 strokes on SI 1 for handicap 19', () => {
      expect(getHandicapStrokes(1, 19)).toBe(2)
      expect(getHandicapStrokes(2, 19)).toBe(1) // All get at least 1, SI 1 gets extra
    })

    it('gives 2 strokes on all holes for handicap 36', () => {
      for (let si = 1; si <= 18; si++) {
        expect(getHandicapStrokes(si, 36)).toBe(2)
      }
    })

    it('distributes strokes correctly for handicap 27', () => {
      // 27 = 18 + 9: all get 1, SI 1-9 get extra
      for (let si = 1; si <= 9; si++) {
        expect(getHandicapStrokes(si, 27)).toBe(2)
      }
      for (let si = 10; si <= 18; si++) {
        expect(getHandicapStrokes(si, 27)).toBe(1)
      }
    })
  })

  describe('handicap 37+ (three rounds of strokes)', () => {
    it('gives 3 strokes on SI 1 for handicap 37', () => {
      expect(getHandicapStrokes(1, 37)).toBe(3)
      expect(getHandicapStrokes(2, 37)).toBe(2)
    })

    it('gives correct strokes for max handicap 54', () => {
      // 54 = 3 * 18: all holes get 3 strokes
      for (let si = 1; si <= 18; si++) {
        expect(getHandicapStrokes(si, 54)).toBe(3)
      }
    })
  })
})

describe('calculateNetScore', () => {
  it('returns gross minus handicap strokes', () => {
    expect(calculateNetScore(5, 1)).toBe(4)
    expect(calculateNetScore(4, 0)).toBe(4)
    expect(calculateNetScore(6, 2)).toBe(4)
  })

  it('handles zero handicap strokes', () => {
    expect(calculateNetScore(4, 0)).toBe(4)
  })

  it('can produce net score of 0 or negative', () => {
    expect(calculateNetScore(3, 3)).toBe(0)
    expect(calculateNetScore(2, 3)).toBe(-1)
  })
})

describe('calculateStablefordPoints', () => {
  it('returns 0 for double bogey or worse', () => {
    expect(calculateStablefordPoints(6, 4)).toBe(STABLEFORD_POINTS.doubleBogeyOrWorse) // +2
    expect(calculateStablefordPoints(7, 4)).toBe(STABLEFORD_POINTS.doubleBogeyOrWorse) // +3
    expect(calculateStablefordPoints(10, 4)).toBe(STABLEFORD_POINTS.doubleBogeyOrWorse) // +6
  })

  it('returns 1 for bogey', () => {
    expect(calculateStablefordPoints(5, 4)).toBe(STABLEFORD_POINTS.bogey)
    expect(calculateStablefordPoints(4, 3)).toBe(STABLEFORD_POINTS.bogey)
    expect(calculateStablefordPoints(6, 5)).toBe(STABLEFORD_POINTS.bogey)
  })

  it('returns 2 for par', () => {
    expect(calculateStablefordPoints(4, 4)).toBe(STABLEFORD_POINTS.par)
    expect(calculateStablefordPoints(3, 3)).toBe(STABLEFORD_POINTS.par)
    expect(calculateStablefordPoints(5, 5)).toBe(STABLEFORD_POINTS.par)
  })

  it('returns 3 for birdie', () => {
    expect(calculateStablefordPoints(3, 4)).toBe(STABLEFORD_POINTS.birdie)
    expect(calculateStablefordPoints(2, 3)).toBe(STABLEFORD_POINTS.birdie)
    expect(calculateStablefordPoints(4, 5)).toBe(STABLEFORD_POINTS.birdie)
  })

  it('returns 4 for eagle', () => {
    expect(calculateStablefordPoints(2, 4)).toBe(STABLEFORD_POINTS.eagle)
    expect(calculateStablefordPoints(1, 3)).toBe(STABLEFORD_POINTS.eagle)
    expect(calculateStablefordPoints(3, 5)).toBe(STABLEFORD_POINTS.eagle)
  })

  it('returns 5 for albatross or better', () => {
    expect(calculateStablefordPoints(1, 4)).toBe(STABLEFORD_POINTS.albatrossOrBetter)
    expect(calculateStablefordPoints(2, 5)).toBe(STABLEFORD_POINTS.albatrossOrBetter)
    expect(calculateStablefordPoints(1, 5)).toBe(STABLEFORD_POINTS.albatrossOrBetter) // Condor
  })
})

describe('isBirdieOrBetter', () => {
  it('returns true for birdie', () => {
    expect(isBirdieOrBetter(3, 4)).toBe(true)
  })

  it('returns true for eagle', () => {
    expect(isBirdieOrBetter(2, 4)).toBe(true)
  })

  it('returns true for albatross', () => {
    expect(isBirdieOrBetter(1, 4)).toBe(true)
  })

  it('returns false for par', () => {
    expect(isBirdieOrBetter(4, 4)).toBe(false)
  })

  it('returns false for bogey or worse', () => {
    expect(isBirdieOrBetter(5, 4)).toBe(false)
    expect(isBirdieOrBetter(6, 4)).toBe(false)
  })
})

describe('calculateHoleScore', () => {
  it('calculates all scoring data correctly for a simple case', () => {
    const hole = createHole({ par: 4, strokeIndex: 1 })
    const result = calculateHoleScore(5, hole, 10)

    expect(result.grossScore).toBe(5)
    expect(result.handicapStrokes).toBe(1) // SI 1 with handicap 10
    expect(result.netScore).toBe(4) // 5 - 1
    expect(result.stablefordPoints).toBe(2) // Net par
  })

  it('handles no handicap strokes', () => {
    const hole = createHole({ par: 4, strokeIndex: 15 })
    const result = calculateHoleScore(4, hole, 10)

    expect(result.handicapStrokes).toBe(0) // SI 15 > handicap 10
    expect(result.netScore).toBe(4)
    expect(result.stablefordPoints).toBe(2)
  })

  it('handles high handicap with multiple strokes', () => {
    const hole = createHole({ par: 4, strokeIndex: 1 })
    const result = calculateHoleScore(6, hole, 25)

    expect(result.handicapStrokes).toBe(2) // SI 1 with handicap 25 = 1 + 1 extra
    expect(result.netScore).toBe(4) // 6 - 2
    expect(result.stablefordPoints).toBe(2) // Net par
  })
})

describe('calculateRoundSummary', () => {
  it('calculates totals for a complete round', () => {
    // Create 18 par 4 holes for predictable testing
    const holes = Array.from({ length: 18 }, () => createHole({ par: 4 }))
    const scores = createRoundScores(18, 4) // All gross 4, net 4 = par

    const result = calculateRoundSummary(scores, holes)

    expect(result.totalGross).toBe(72) // 18 * 4
    expect(result.totalNet).toBe(72)
    expect(result.totalStableford).toBe(36) // 18 * 2 pts (all pars)
    expect(result.birdiesOrBetter).toBe(0) // All pars, no birdies
  })

  it('handles empty arrays', () => {
    const result = calculateRoundSummary([], [])

    expect(result.totalGross).toBe(0)
    expect(result.totalNet).toBe(0)
    expect(result.totalStableford).toBe(0)
    expect(result.birdiesOrBetter).toBe(0)
  })

  it('counts birdies or better correctly', () => {
    const holes = [
      createHole({ par: 4 }),
      createHole({ par: 4 }),
      createHole({ par: 4 }),
    ]
    const scores = [
      createScore({ grossScore: 3, netScore: 3, stablefordPoints: 3 }), // Birdie
      createScore({ grossScore: 4, netScore: 4, stablefordPoints: 2 }), // Par
      createScore({ grossScore: 2, netScore: 2, stablefordPoints: 4 }), // Eagle
    ]

    const result = calculateRoundSummary(scores, holes)

    expect(result.birdiesOrBetter).toBe(2) // Birdie + Eagle
  })

  it('handles partial rounds', () => {
    // Create 9 par 4 holes for predictable testing
    const holes = Array.from({ length: 9 }, () => createHole({ par: 4 }))
    const scores = createRoundScores(9, 5) // All gross 5, net 5 = bogey on par 4

    const result = calculateRoundSummary(scores, holes)

    expect(result.totalGross).toBe(45) // 9 * 5
    expect(result.totalNet).toBe(45) // 9 * 5 (no handicap adjustment in scores)
    expect(result.totalStableford).toBe(18) // 9 * 2 pts (scores have stableford: 2 by default)
  })
})

describe('calculateCourseHandicap', () => {
  it('calculates correctly with standard slope', () => {
    // Course handicap = HI * (slope / 113)
    expect(calculateCourseHandicap(10, STANDARD_SLOPE)).toBe(10) // 10 * (113/113) = 10
  })

  it('rounds to nearest integer', () => {
    // 10 * (130 / 113) = 11.504... -> 12
    expect(calculateCourseHandicap(10, 130)).toBe(12)
  })

  it('handles high slopes', () => {
    // 18 * (155 / 113) = 24.69 -> 25
    expect(calculateCourseHandicap(18, 155)).toBe(25)
  })

  it('handles low slopes', () => {
    // 18 * (90 / 113) = 14.33 -> 14
    expect(calculateCourseHandicap(18, 90)).toBe(14)
  })

  it('handles zero handicap index', () => {
    expect(calculateCourseHandicap(0, 130)).toBe(0)
  })
})

describe('calculatePlayingHandicap', () => {
  it('returns course handicap when no course rating', () => {
    expect(calculatePlayingHandicap(15, null, 72)).toBe(15)
  })

  it('adjusts for course rating above par', () => {
    // Playing = CH + (CR - Par)
    // 15 + (74.5 - 72) = 17.5 -> 18
    expect(calculatePlayingHandicap(15, 74.5, 72)).toBe(18)
  })

  it('adjusts for course rating below par', () => {
    // 15 + (70 - 72) = 13
    expect(calculatePlayingHandicap(15, 70, 72)).toBe(13)
  })

  it('handles course rating equal to par', () => {
    expect(calculatePlayingHandicap(15, 72, 72)).toBe(15)
  })
})

describe('getPlayingHandicap', () => {
  it('calculates full playing handicap from all inputs', () => {
    // HI=15, slope=130, CR=73, par=72
    // CH = 15 * (130/113) = 17.26 -> 17
    // PH = 17 + (73 - 72) = 18
    const result = getPlayingHandicap(15, 130, 73, 72)
    expect(result).toBe(18)
  })

  it('uses standard slope when slope is null', () => {
    // HI=15, slope=null->113, CR=72, par=72
    // CH = 15 * (113/113) = 15
    // PH = 15 + (72 - 72) = 15
    const result = getPlayingHandicap(15, null, 72, 72)
    expect(result).toBe(15)
  })

  it('skips course rating adjustment when null', () => {
    // HI=15, slope=130, CR=null, par=72
    // CH = 15 * (130/113) = 17
    // PH = 17 (no CR adjustment)
    const result = getPlayingHandicap(15, 130, null, 72)
    expect(result).toBe(17)
  })

  it('handles both null values', () => {
    // Uses HI as course handicap, no CR adjustment
    const result = getPlayingHandicap(15, null, null, 72)
    expect(result).toBe(15)
  })

  it('handles scratch golfer', () => {
    const result = getPlayingHandicap(0, 130, 73, 72)
    // CH = 0 * (130/113) = 0
    // PH = 0 + (73 - 72) = 1
    expect(result).toBe(1)
  })

  it('handles high handicap golfer', () => {
    const result = getPlayingHandicap(36, 140, 75, 72)
    // CH = 36 * (140/113) = 44.6 -> 45
    // PH = 45 + (75 - 72) = 48
    expect(result).toBe(48)
  })
})
