/**
 * Golf constants used across Bombadil specs
 */

// Standard Stableford point mapping
export const STABLEFORD_POINTS = {
  DOUBLE_BOGEY_OR_WORSE: 0,
  BOGEY: 1,
  PAR: 2,
  BIRDIE: 3,
  EAGLE: 4,
  ALBATROSS: 5,
} as const

// Score constraints
export const SCORE_CONSTRAINTS = {
  MIN_GROSS_SCORE: 1,
  MAX_GROSS_SCORE: 15,
  MIN_HANDICAP_INDEX: 0,
  MAX_HANDICAP_INDEX: 54,
  MIN_PAR: 3,
  MAX_PAR: 5,
  MIN_STROKE_INDEX: 1,
  MAX_STROKE_INDEX: 18,
  STANDARD_SLOPE: 113,
} as const

// Course rating bounds (typical ranges)
export const COURSE_RATING_BOUNDS = {
  MIN_RATING: 60,
  MAX_RATING: 80,
  MIN_SLOPE: 55,
  MAX_SLOPE: 155,
} as const

// Time bounds for temporal properties (ms)
export const TEMPORAL_BOUNDS = {
  SCORE_UPDATE_REFLECTED: 500,
  LEADERBOARD_UPDATE: 3000,
  FORM_ERROR_CLEAR: 2000,
  PAGE_LOAD: 5000,
} as const

// Navigation routes
export const ROUTES = {
  HOME: '/',
  GOLFERS: '/golfers',
  COURSES: '/courses',
  TRIPS: '/trips',
  NEW_TRIP: '/trips/new',
} as const
