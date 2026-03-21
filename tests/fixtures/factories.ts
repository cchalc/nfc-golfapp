/**
 * Test data factories for creating test fixtures
 */

// Hole factory - creates a hole with customizable properties
export function createHole(overrides: Partial<{ par: number; strokeIndex: number }> = {}) {
  return {
    par: overrides.par ?? 4,
    strokeIndex: overrides.strokeIndex ?? 1,
  }
}

// Create standard 18-hole set
export function createHoles18(): Array<{ par: number; strokeIndex: number }> {
  // Mix of par 3, 4, 5 holes with proper stroke indexes
  const pars = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5]
  return pars.map((par, idx) => ({
    par,
    strokeIndex: idx + 1, // 1-18 stroke indexes
  }))
}

// Score factory
export function createScore(
  overrides: Partial<{
    grossScore: number
    netScore: number
    stablefordPoints: number
    handicapStrokes: number
  }> = {}
) {
  return {
    grossScore: overrides.grossScore ?? 4,
    netScore: overrides.netScore ?? 4,
    stablefordPoints: overrides.stablefordPoints ?? 2,
    handicapStrokes: overrides.handicapStrokes ?? 0,
  }
}

// Create array of scores for a round
export function createRoundScores(
  count: number,
  defaultGross = 4
): Array<{ grossScore: number; netScore: number; stablefordPoints: number }> {
  return Array.from({ length: count }, () => ({
    grossScore: defaultGross,
    netScore: defaultGross,
    stablefordPoints: 2,
  }))
}

// Golfer factory
export function createGolfer(
  overrides: Partial<{
    name: string
    email: string
    phone: string
    handicap: number
    handicapHistory: Array<{ handicap: number; date: Date; source: 'manual' | 'ghin' | 'import' }>
  }> = {}
) {
  const handicap = overrides.handicap ?? 15
  return {
    name: overrides.name ?? 'Test Golfer',
    email: overrides.email ?? 'test@example.com',
    phone: overrides.phone ?? '555-1234',
    handicap,
    handicapHistory: overrides.handicapHistory ?? [
      { handicap, date: new Date(), source: 'manual' as const },
    ],
  }
}

// Trip factory
export function createTrip(
  overrides: Partial<{
    name: string
    description: string
    startDate: string
    endDate: string
    location: string
  }> = {}
) {
  return {
    name: overrides.name ?? 'Test Golf Trip',
    description: overrides.description ?? 'A fun golf trip',
    startDate: overrides.startDate ?? '2024-06-01',
    endDate: overrides.endDate ?? '2024-06-07',
    location: overrides.location ?? 'Pebble Beach, CA',
  }
}

// Course factory
export function createCourse(
  overrides: Partial<{
    name: string
    location: string
    courseRating: number | null
    slopeRating: number | null
    totalPar: number
  }> = {}
) {
  return {
    name: overrides.name ?? 'Test Course',
    location: overrides.location ?? 'Test City, ST',
    courseRating: overrides.courseRating ?? 72.5,
    slopeRating: overrides.slopeRating ?? 130,
    totalPar: overrides.totalPar ?? 72,
  }
}

// Challenge result factory
export function createChallengeResult(
  golferId: string,
  resultNumeric: number | null = null
) {
  return { golferId, resultNumeric }
}

// TripGolfer factory
export function createTripGolfer(
  overrides: Partial<{
    id: string
    tripId: string
    golferId: string
    status: 'invited' | 'accepted' | 'declined'
    handicapOverride: number | null
  }> = {}
) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    tripId: overrides.tripId ?? 'trip-1',
    golferId: overrides.golferId ?? 'golfer-1',
    status: overrides.status ?? 'accepted',
    invitedAt: new Date(),
    acceptedAt: new Date(),
    includedInScoring: true,
    handicapOverride: overrides.handicapOverride ?? null,
  }
}

// Challenge type constants for testing
export const CHALLENGE_TYPES = [
  'closest_to_pin',
  'longest_drive',
  'most_birdies',
  'best_net',
  'best_stableford',
  'custom',
] as const

// Standard slope rating (used when null)
export const STANDARD_SLOPE = 113

// Handicap test cases
export const HANDICAP_TEST_CASES = {
  scratch: 0,
  lowSingle: 5,
  midSingle: 10,
  highSingle: 15,
  mid: 18,
  high: 25,
  veryHigh: 36,
  maximum: 54,
}

// Stableford point mapping for reference
export const STABLEFORD_POINTS = {
  doubleBogeyOrWorse: 0,
  bogey: 1,
  par: 2,
  birdie: 3,
  eagle: 4,
  albatrossOrBetter: 5,
}
