import type { Challenge } from '../db/collections'

export type ChallengeType = Challenge['challengeType']

/**
 * Parse a distance string like "4'6\"" or "4ft 6in" into feet (decimal)
 * Examples: "4'6\"" → 4.5, "12'" → 12, "3ft 2in" → 3.167
 */
export function parseKpDistance(input: string): number | null {
  if (!input?.trim()) return null

  const normalized = input.trim().toLowerCase()

  // Try feet'inches" format: 4'6" or 4' 6"
  const feetInchesMatch = normalized.match(/^(\d+(?:\.\d+)?)'?\s*(\d+(?:\.\d+)?)?[""]?$/)
  if (feetInchesMatch) {
    const feet = parseFloat(feetInchesMatch[1])
    const inches = feetInchesMatch[2] ? parseFloat(feetInchesMatch[2]) : 0
    return feet + inches / 12
  }

  // Try "Xft Yin" format
  const ftInMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*(?:ft|feet)?\s*(\d+(?:\.\d+)?)?\s*(?:in|inch|inches)?$/)
  if (ftInMatch) {
    const feet = parseFloat(ftInMatch[1])
    const inches = ftInMatch[2] ? parseFloat(ftInMatch[2]) : 0
    return feet + inches / 12
  }

  // Try plain number (assumed feet)
  const plainNumber = parseFloat(normalized)
  if (!isNaN(plainNumber)) {
    return plainNumber
  }

  return null
}

/**
 * Format feet (decimal) to feet'inches" string
 * Examples: 4.5 → "4'6\"", 12 → "12'0\""
 */
export function formatKpDistance(feet: number): string {
  const wholeFeet = Math.floor(feet)
  const inches = Math.round((feet - wholeFeet) * 12)

  // Handle rounding up to next foot
  if (inches === 12) {
    return `${wholeFeet + 1}'0"`
  }

  return `${wholeFeet}'${inches}"`
}

/**
 * Check if a challenge type requires manual result entry
 */
export function isManualChallenge(type: ChallengeType): boolean {
  return type === 'closest_to_pin' || type === 'longest_drive' || type === 'custom'
}

/**
 * Check if a challenge type is auto-calculated from round data
 */
export function isAutoCalculatedChallenge(type: ChallengeType): boolean {
  return type === 'most_birdies'
}

/**
 * Get Radix color for challenge type badge
 */
export function getChallengeColor(type: ChallengeType): 'amber' | 'grass' | 'blue' | 'gray' {
  switch (type) {
    case 'closest_to_pin':
      return 'amber'
    case 'longest_drive':
      return 'grass'
    case 'most_birdies':
      return 'blue'
    case 'custom':
    default:
      return 'gray'
  }
}

/**
 * Get human-readable label for challenge type
 */
export function getChallengeTypeLabel(type: ChallengeType): string {
  switch (type) {
    case 'closest_to_pin':
      return 'Closest to Pin'
    case 'longest_drive':
      return 'Longest Drive'
    case 'most_birdies':
      return 'Most Birdies'
    case 'custom':
      return 'Custom'
    default:
      return type
  }
}

/**
 * Get default scope for a challenge type
 */
export function getDefaultScope(type: ChallengeType): 'hole' | 'round' | 'trip' {
  switch (type) {
    case 'closest_to_pin':
    case 'longest_drive':
      return 'hole'
    case 'most_birdies':
      return 'round'
    case 'custom':
    default:
      return 'trip'
  }
}

/**
 * Determine winner from results (lowest distance for KP, highest for LD)
 */
export function determineWinner(
  results: Array<{ golferId: string; resultNumeric: number | null }>,
  type: ChallengeType
): string | null {
  const validResults = results.filter((r) => r.resultNumeric !== null)
  if (validResults.length === 0) return null

  if (type === 'closest_to_pin') {
    // Lowest distance wins
    const winner = validResults.reduce((min, r) =>
      r.resultNumeric! < min.resultNumeric! ? r : min
    )
    return winner.golferId
  }

  // For longest_drive and others, highest value wins
  const winner = validResults.reduce((max, r) =>
    r.resultNumeric! > max.resultNumeric! ? r : max
  )
  return winner.golferId
}
