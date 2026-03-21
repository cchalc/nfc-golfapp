import { describe, it, expect } from 'vitest'
import {
  parseKpDistance,
  formatKpDistance,
  isManualChallenge,
  isAutoCalculatedChallenge,
  getChallengeColor,
  getChallengeTypeLabel,
  getDefaultScope,
  determineWinner,
} from '../../../src/lib/challenges'
import { createChallengeResult, CHALLENGE_TYPES } from '../../fixtures/factories'

describe('parseKpDistance', () => {
  describe('feet and inches format (X\'Y")', () => {
    it('parses standard format 4\'6"', () => {
      expect(parseKpDistance('4\'6"')).toBeCloseTo(4.5, 2)
    })

    it('parses format with space 4\' 6"', () => {
      expect(parseKpDistance('4\' 6"')).toBeCloseTo(4.5, 2)
    })

    it('parses feet only 12\'', () => {
      expect(parseKpDistance('12\'')).toBe(12)
    })

    it('parses with smart quotes', () => {
      expect(parseKpDistance('4\'6"')).toBeCloseTo(4.5, 2)
    })

    it('parses decimal feet 4.5\'', () => {
      expect(parseKpDistance('4.5\'')).toBeCloseTo(4.5, 2)
    })
  })

  describe('ft/in format', () => {
    it('parses "4ft 6in"', () => {
      expect(parseKpDistance('4ft 6in')).toBeCloseTo(4.5, 2)
    })

    it('parses "4 ft 6 in"', () => {
      expect(parseKpDistance('4 ft 6 in')).toBeCloseTo(4.5, 2)
    })

    it('parses "4feet 6inches"', () => {
      expect(parseKpDistance('4feet 6inches')).toBeCloseTo(4.5, 2)
    })

    it('parses feet only "12ft"', () => {
      expect(parseKpDistance('12ft')).toBe(12)
    })

    it('parses case insensitive "4FT 6IN"', () => {
      expect(parseKpDistance('4FT 6IN')).toBeCloseTo(4.5, 2)
    })
  })

  describe('plain number format', () => {
    it('parses whole number "12"', () => {
      expect(parseKpDistance('12')).toBe(12)
    })

    it('parses decimal "4.5"', () => {
      expect(parseKpDistance('4.5')).toBe(4.5)
    })

    it('parses with leading/trailing whitespace', () => {
      expect(parseKpDistance('  4.5  ')).toBe(4.5)
    })
  })

  describe('invalid input', () => {
    it('returns null for empty string', () => {
      expect(parseKpDistance('')).toBeNull()
    })

    it('returns null for whitespace only', () => {
      expect(parseKpDistance('   ')).toBeNull()
    })

    it('returns null for invalid format', () => {
      expect(parseKpDistance('invalid')).toBeNull()
    })

    it('returns null for null-ish input', () => {
      // @ts-expect-error testing runtime behavior
      expect(parseKpDistance(null)).toBeNull()
      // @ts-expect-error testing runtime behavior
      expect(parseKpDistance(undefined)).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(parseKpDistance('0')).toBe(0)
    })

    it('handles 11 inches', () => {
      expect(parseKpDistance('4\'11"')).toBeCloseTo(4 + 11 / 12, 2)
    })

    it('handles fractional inches', () => {
      expect(parseKpDistance('4\'6.5"')).toBeCloseTo(4 + 6.5 / 12, 2)
    })
  })
})

describe('formatKpDistance', () => {
  it('formats whole feet', () => {
    expect(formatKpDistance(12)).toBe('12\'0"')
  })

  it('formats feet with 6 inches', () => {
    expect(formatKpDistance(4.5)).toBe('4\'6"')
  })

  it('formats feet with various inches', () => {
    expect(formatKpDistance(4.25)).toBe('4\'3"') // 0.25 * 12 = 3
    expect(formatKpDistance(4.75)).toBe('4\'9"') // 0.75 * 12 = 9
  })

  it('rounds inches to nearest whole number', () => {
    expect(formatKpDistance(4.04)).toBe('4\'0"') // 0.04 * 12 = 0.48 -> 0
    expect(formatKpDistance(4.08)).toBe('4\'1"') // 0.08 * 12 = 0.96 -> 1
  })

  it('handles rounding up to next foot', () => {
    // 4.99 -> wholeFeet=4, inches = 0.99 * 12 = 11.88 -> rounds to 12
    // Should become 5'0" not 4'12"
    expect(formatKpDistance(4.99)).toBe('5\'0"')
  })

  it('handles zero', () => {
    expect(formatKpDistance(0)).toBe('0\'0"')
  })
})

describe('isManualChallenge', () => {
  it('returns true for closest_to_pin', () => {
    expect(isManualChallenge('closest_to_pin')).toBe(true)
  })

  it('returns true for longest_drive', () => {
    expect(isManualChallenge('longest_drive')).toBe(true)
  })

  it('returns true for custom', () => {
    expect(isManualChallenge('custom')).toBe(true)
  })

  it('returns false for auto-calculated types', () => {
    expect(isManualChallenge('most_birdies')).toBe(false)
  })
})

describe('isAutoCalculatedChallenge', () => {
  it('returns true for most_birdies', () => {
    expect(isAutoCalculatedChallenge('most_birdies')).toBe(true)
  })

  it('returns false for manual types', () => {
    expect(isAutoCalculatedChallenge('closest_to_pin')).toBe(false)
    expect(isAutoCalculatedChallenge('longest_drive')).toBe(false)
    expect(isAutoCalculatedChallenge('custom')).toBe(false)
  })
})

describe('getChallengeColor', () => {
  it('returns amber for closest_to_pin', () => {
    expect(getChallengeColor('closest_to_pin')).toBe('amber')
  })

  it('returns grass for longest_drive', () => {
    expect(getChallengeColor('longest_drive')).toBe('grass')
  })

  it('returns blue for most_birdies', () => {
    expect(getChallengeColor('most_birdies')).toBe('blue')
  })

  it('returns gray for custom', () => {
    expect(getChallengeColor('custom')).toBe('gray')
  })
})

describe('getChallengeTypeLabel', () => {
  it('returns human-readable labels for all types', () => {
    expect(getChallengeTypeLabel('closest_to_pin')).toBe('Closest to Pin')
    expect(getChallengeTypeLabel('longest_drive')).toBe('Longest Drive')
    expect(getChallengeTypeLabel('most_birdies')).toBe('Most Birdies')
    expect(getChallengeTypeLabel('custom')).toBe('Custom')
  })

  it('returns the type itself for unknown types', () => {
    // @ts-expect-error testing runtime behavior
    expect(getChallengeTypeLabel('unknown_type')).toBe('unknown_type')
  })
})

describe('getDefaultScope', () => {
  it('returns hole for closest_to_pin', () => {
    expect(getDefaultScope('closest_to_pin')).toBe('hole')
  })

  it('returns hole for longest_drive', () => {
    expect(getDefaultScope('longest_drive')).toBe('hole')
  })

  it('returns round for most_birdies', () => {
    expect(getDefaultScope('most_birdies')).toBe('round')
  })

  it('returns trip for custom', () => {
    expect(getDefaultScope('custom')).toBe('trip')
  })
})

describe('determineWinner', () => {
  describe('closest_to_pin (lowest wins)', () => {
    it('returns golfer with lowest distance', () => {
      const results = [
        createChallengeResult('golfer-1', 10),
        createChallengeResult('golfer-2', 5),
        createChallengeResult('golfer-3', 15),
      ]
      expect(determineWinner(results, 'closest_to_pin')).toBe('golfer-2')
    })

    it('returns first golfer on tie', () => {
      const results = [
        createChallengeResult('golfer-1', 5),
        createChallengeResult('golfer-2', 5),
      ]
      // reduce picks first match
      expect(determineWinner(results, 'closest_to_pin')).toBe('golfer-1')
    })
  })

  describe('longest_drive (highest wins)', () => {
    it('returns golfer with highest distance', () => {
      const results = [
        createChallengeResult('golfer-1', 250),
        createChallengeResult('golfer-2', 300),
        createChallengeResult('golfer-3', 275),
      ]
      expect(determineWinner(results, 'longest_drive')).toBe('golfer-2')
    })

    it('returns first golfer on tie', () => {
      const results = [
        createChallengeResult('golfer-1', 300),
        createChallengeResult('golfer-2', 300),
      ]
      expect(determineWinner(results, 'longest_drive')).toBe('golfer-1')
    })
  })

  describe('other types (highest wins)', () => {
    it('returns highest for most_birdies', () => {
      const results = [
        createChallengeResult('golfer-1', 3),
        createChallengeResult('golfer-2', 5),
      ]
      expect(determineWinner(results, 'most_birdies')).toBe('golfer-2')
    })

    it('returns highest for custom', () => {
      const results = [
        createChallengeResult('golfer-1', 36),
        createChallengeResult('golfer-2', 40),
      ]
      expect(determineWinner(results, 'custom')).toBe('golfer-2')
    })
  })

  describe('edge cases', () => {
    it('returns null for empty results', () => {
      expect(determineWinner([], 'closest_to_pin')).toBeNull()
    })

    it('returns null when all results have null values', () => {
      const results = [
        createChallengeResult('golfer-1', null),
        createChallengeResult('golfer-2', null),
      ]
      expect(determineWinner(results, 'closest_to_pin')).toBeNull()
    })

    it('filters out null values before determining winner', () => {
      const results = [
        createChallengeResult('golfer-1', null),
        createChallengeResult('golfer-2', 10),
        createChallengeResult('golfer-3', null),
      ]
      expect(determineWinner(results, 'closest_to_pin')).toBe('golfer-2')
    })

    it('handles single valid result', () => {
      const results = [createChallengeResult('golfer-1', 10)]
      expect(determineWinner(results, 'closest_to_pin')).toBe('golfer-1')
    })
  })
})
