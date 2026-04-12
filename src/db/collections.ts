import { z } from 'zod'

// Helper for date fields that can come as string or Date
const dateField = z
  .union([z.string(), z.date()])
  .transform((val) => (typeof val === 'string' ? new Date(val) : val))

const nullableDateField = z
  .union([z.string(), z.date(), z.null()])
  .transform((val) =>
    val === null ? null : typeof val === 'string' ? new Date(val) : val
  )

// ============================================================================
// Schemas
// ============================================================================

export const tripSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  startDate: dateField,
  endDate: dateField,
  location: z.string().default(''),
  createdBy: z.string(),
  createdAt: dateField,
})

export const golferSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().default(''),
  phone: z.string().default(''),
  handicap: z.number().default(0),
  profileImageUrl: z.string().nullable().default(null),
  createdAt: dateField,
})

export const tripGolferSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  golferId: z.string(),
  status: z.enum(['invited', 'accepted', 'declined']).default('invited'),
  invitedAt: dateField,
  acceptedAt: nullableDateField.default(null),
  includedInScoring: z.boolean().default(true),
  handicapOverride: z.number().nullable().default(null),
})

export const courseSchema = z.object({
  id: z.string(),
  apiId: z.number().nullable().default(null),
  name: z.string(),
  clubName: z.string().default(''),
  location: z.string().default(''),
  address: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  country: z.string().default(''),
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  courseRating: z.number().nullable().default(null),
  slopeRating: z.number().nullable().default(null),
  totalPar: z.number().default(72),
})

export const teeBoxSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  teeName: z.string(),
  gender: z.enum(['male', 'female']),
  courseRating: z.number(),
  slopeRating: z.number(),
  totalYards: z.number(),
  parTotal: z.number(),
})

export const holeSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  holeNumber: z.number(),
  par: z.number(),
  strokeIndex: z.number(),
  yardage: z.number().nullable().default(null),
})

export const roundSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  courseId: z.string(),
  roundDate: dateField,
  roundNumber: z.number().default(1),
  notes: z.string().default(''),
  includedInScoring: z.boolean().default(true),
})

export const scoreSchema = z.object({
  id: z.string(),
  roundId: z.string(),
  golferId: z.string(),
  holeId: z.string(),
  grossScore: z.number(),
  handicapStrokes: z.number().default(0),
  netScore: z.number(),
  stablefordPoints: z.number().default(0),
})

export const roundSummarySchema = z.object({
  id: z.string(),
  roundId: z.string(),
  golferId: z.string(),
  totalGross: z.number(),
  totalNet: z.number(),
  totalStableford: z.number(),
  birdiesOrBetter: z.number().default(0),
  kps: z.number().default(0),
  includedInScoring: z.boolean().default(true),
})

export const teamSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  color: z.string().default('#3b82f6'),
})

export const teamMemberSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  golferId: z.string(),
  tripId: z.string(),
})

export const challengeSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  description: z.string().default(''),
  challengeType: z
    .enum([
      'closest_to_pin',
      'longest_drive',
      'most_birdies',
      'custom',
    ])
    .default('custom'),
  scope: z.enum(['hole', 'round', 'trip']).default('trip'),
  roundId: z.string().nullable().default(null),
  holeId: z.string().nullable().default(null),
  prizeDescription: z.string().default(''),
})

export const challengeResultSchema = z.object({
  id: z.string(),
  challengeId: z.string(),
  golferId: z.string(),
  resultValue: z.string().default(''),
  resultNumeric: z.number().nullable().default(null),
  isWinner: z.boolean().default(false),
})

// ============================================================================
// Auth Schemas
// ============================================================================

export const identitySchema = z.object({
  id: z.string(),
  email: z.string(),
  golferId: z.string().nullable().default(null),
  createdAt: dateField,
  lastLoginAt: nullableDateField.default(null),
})

export const tripOrganizerSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  identityId: z.string(),
  role: z.enum(['owner', 'organizer']).default('organizer'),
  addedAt: dateField,
})

export const tripInviteSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  token: z.string(),
  createdBy: z.string(),
  expiresAt: dateField,
  maxUses: z.number().nullable().default(null),
  useCount: z.number().default(0),
  createdAt: dateField,
})

// ============================================================================
// Type exports
// ============================================================================

export type Trip = z.output<typeof tripSchema>
export type Golfer = z.output<typeof golferSchema>
export type TripGolfer = z.output<typeof tripGolferSchema>
export type Course = z.output<typeof courseSchema>
export type TeeBox = z.output<typeof teeBoxSchema>
export type Hole = z.output<typeof holeSchema>
export type Round = z.output<typeof roundSchema>
export type Score = z.output<typeof scoreSchema>
export type RoundSummary = z.output<typeof roundSummarySchema>
export type Team = z.output<typeof teamSchema>
export type TeamMember = z.output<typeof teamMemberSchema>
export type Challenge = z.output<typeof challengeSchema>
export type ChallengeResult = z.output<typeof challengeResultSchema>
export type Identity = z.output<typeof identitySchema>
export type TripOrganizer = z.output<typeof tripOrganizerSchema>
export type TripInvite = z.output<typeof tripInviteSchema>
