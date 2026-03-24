import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { snakeCamelMapper } from '@electric-sql/client'
import { z } from 'zod'

import {
  insertTrip,
  updateTrip,
  deleteTrip,
  insertGolfer,
  updateGolfer,
  deleteGolfer,
  insertTripGolfer,
  updateTripGolfer,
  deleteTripGolfer,
  insertCourse,
  updateCourse,
  deleteCourse,
  insertTeeBox,
  updateTeeBox,
  deleteTeeBox,
  insertHole,
  updateHole,
  deleteHole,
  insertRound,
  updateRound,
  deleteRound,
  insertScore,
  updateScore,
  deleteScore,
  insertRoundSummary,
  updateRoundSummary,
  deleteRoundSummary,
  insertTeam,
  updateTeam,
  deleteTeam,
  insertTeamMember,
  deleteTeamMember,
  insertChallenge,
  updateChallenge,
  deleteChallenge,
  insertChallengeResult,
  updateChallengeResult,
  deleteChallengeResult,
} from '../server/mutations'

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

// UI State collection for managing dialog open states (local-only)
export const uiStateSchema = z.object({
  id: z.string(),
  dialogId: z.string(),
  isOpen: z.boolean(),
})

// Form error collection for tracking validation errors (local-only)
export const formErrorSchema = z.object({
  id: z.string(),
  formId: z.string(),
  field: z.string(),
  message: z.string(),
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
export type UIState = z.output<typeof uiStateSchema>
export type FormError = z.output<typeof formErrorSchema>

// ============================================================================
// Helper: Build Electric shape URL
// ============================================================================

function getShapeUrl(path: string): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5173'
  return new URL(path, base).toString()
}

// Parser for timestamptz columns - Electric delivers dates as ISO strings
const timestampParser = { timestamptz: (date: string) => new Date(date) }

// Column mapper to convert snake_case from DB to camelCase in client
const columnMapper = snakeCamelMapper()

// ============================================================================
// Electric Collections (synced with PostgreSQL)
// ============================================================================

export const tripCollection = createCollection(
  electricCollectionOptions({
    id: 'trips',
    schema: tripSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/trips'),
      parser: timestampParser,
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: trip } = transaction.mutations[0]
      const { txid } = await insertTrip({ data: trip })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: trip } = transaction.mutations[0]
      const { txid } = await updateTrip({ data: { id: trip.id, changes: trip } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: trip } = transaction.mutations[0]
      const { txid } = await deleteTrip({ data: { id: trip.id } })
      return { txid }
    },
  })
)

export const golferCollection = createCollection(
  electricCollectionOptions({
    id: 'golfers',
    schema: golferSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/golfers'),
      parser: timestampParser,
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: golfer } = transaction.mutations[0]
      const { txid } = await insertGolfer({ data: golfer })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: golfer } = transaction.mutations[0]
      const { txid } = await updateGolfer({ data: { id: golfer.id, changes: golfer } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: golfer } = transaction.mutations[0]
      const { txid } = await deleteGolfer({ data: { id: golfer.id } })
      return { txid }
    },
  })
)

export const tripGolferCollection = createCollection(
  electricCollectionOptions({
    id: 'trip_golfers',
    schema: tripGolferSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/trip-golfers'),
      parser: timestampParser,
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: tripGolfer } = transaction.mutations[0]
      const { txid } = await insertTripGolfer({ data: tripGolfer })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: tripGolfer } = transaction.mutations[0]
      const { txid } = await updateTripGolfer({ data: { id: tripGolfer.id, changes: tripGolfer } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: tripGolfer } = transaction.mutations[0]
      const { txid } = await deleteTripGolfer({ data: { id: tripGolfer.id } })
      return { txid }
    },
  })
)

export const courseCollection = createCollection(
  electricCollectionOptions({
    id: 'courses',
    schema: courseSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/courses'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: course } = transaction.mutations[0]
      const { txid } = await insertCourse({ data: course })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: course } = transaction.mutations[0]
      const { txid } = await updateCourse({ data: { id: course.id, changes: course } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: course } = transaction.mutations[0]
      const { txid } = await deleteCourse({ data: { id: course.id } })
      return { txid }
    },
  })
)

export const teeBoxCollection = createCollection(
  electricCollectionOptions({
    id: 'tee_boxes',
    schema: teeBoxSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/tee-boxes'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: teeBox } = transaction.mutations[0]
      const { txid } = await insertTeeBox({ data: teeBox })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: teeBox } = transaction.mutations[0]
      const { txid } = await updateTeeBox({ data: { id: teeBox.id, changes: teeBox } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: teeBox } = transaction.mutations[0]
      const { txid } = await deleteTeeBox({ data: { id: teeBox.id } })
      return { txid }
    },
  })
)

export const holeCollection = createCollection(
  electricCollectionOptions({
    id: 'holes',
    schema: holeSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/holes'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: hole } = transaction.mutations[0]
      const { txid } = await insertHole({ data: hole })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: hole } = transaction.mutations[0]
      const { txid } = await updateHole({ data: { id: hole.id, changes: hole } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: hole } = transaction.mutations[0]
      const { txid } = await deleteHole({ data: { id: hole.id } })
      return { txid }
    },
  })
)

export const roundCollection = createCollection(
  electricCollectionOptions({
    id: 'rounds',
    schema: roundSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/rounds'),
      parser: timestampParser,
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: round } = transaction.mutations[0]
      const { txid } = await insertRound({ data: round })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: round } = transaction.mutations[0]
      const { txid } = await updateRound({ data: { id: round.id, changes: round } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: round } = transaction.mutations[0]
      const { txid } = await deleteRound({ data: { id: round.id } })
      return { txid }
    },
  })
)

export const scoreCollection = createCollection(
  electricCollectionOptions({
    id: 'scores',
    schema: scoreSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/scores'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: score } = transaction.mutations[0]
      const { txid } = await insertScore({ data: score })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: score } = transaction.mutations[0]
      const { txid } = await updateScore({ data: { id: score.id, changes: score } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: score } = transaction.mutations[0]
      const { txid } = await deleteScore({ data: { id: score.id } })
      return { txid }
    },
  })
)

export const roundSummaryCollection = createCollection(
  electricCollectionOptions({
    id: 'round_summaries',
    schema: roundSummarySchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/round-summaries'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: summary } = transaction.mutations[0]
      const { txid } = await insertRoundSummary({ data: summary })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: summary } = transaction.mutations[0]
      const { txid } = await updateRoundSummary({ data: { id: summary.id, changes: summary } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: summary } = transaction.mutations[0]
      const { txid } = await deleteRoundSummary({ data: { id: summary.id } })
      return { txid }
    },
  })
)

export const teamCollection = createCollection(
  electricCollectionOptions({
    id: 'teams',
    schema: teamSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/teams'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: team } = transaction.mutations[0]
      const { txid } = await insertTeam({ data: team })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: team } = transaction.mutations[0]
      const { txid } = await updateTeam({ data: { id: team.id, changes: team } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: team } = transaction.mutations[0]
      const { txid } = await deleteTeam({ data: { id: team.id } })
      return { txid }
    },
  })
)

export const teamMemberCollection = createCollection(
  electricCollectionOptions({
    id: 'team_members',
    schema: teamMemberSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/team-members'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: teamMember } = transaction.mutations[0]
      const { txid } = await insertTeamMember({ data: teamMember })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: teamMember } = transaction.mutations[0]
      const { txid } = await deleteTeamMember({ data: { id: teamMember.id } })
      return { txid }
    },
  })
)

export const challengeCollection = createCollection(
  electricCollectionOptions({
    id: 'challenges',
    schema: challengeSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/challenges'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: challenge } = transaction.mutations[0]
      const { txid } = await insertChallenge({ data: challenge })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: challenge } = transaction.mutations[0]
      const { txid } = await updateChallenge({ data: { id: challenge.id, changes: challenge } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: challenge } = transaction.mutations[0]
      const { txid } = await deleteChallenge({ data: { id: challenge.id } })
      return { txid }
    },
  })
)

export const challengeResultCollection = createCollection(
  electricCollectionOptions({
    id: 'challenge_results',
    schema: challengeResultSchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',
    shapeOptions: {
      url: getShapeUrl('/api/electric/challenge-results'),
      columnMapper,
    },
    onInsert: async ({ transaction }) => {
      const { modified: result } = transaction.mutations[0]
      const { txid } = await insertChallengeResult({ data: result })
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified: result } = transaction.mutations[0]
      const { txid } = await updateChallengeResult({ data: { id: result.id, changes: result } })
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const { original: result } = transaction.mutations[0]
      const { txid } = await deleteChallengeResult({ data: { id: result.id } })
      return { txid }
    },
  })
)

// ============================================================================
// Local-only Collections (UI state, not synced)
// ============================================================================

export const uiStateCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (item) => item.id,
    schema: uiStateSchema,
  })
)

export const formErrorCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (item) => item.id,
    schema: formErrorSchema,
  })
)
