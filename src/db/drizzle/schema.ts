import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ============================================================================
// Enums
// ============================================================================

export const tripGolferStatusEnum = pgEnum('trip_golfer_status', [
  'invited',
  'accepted',
  'declined',
])

export const teeBoxGenderEnum = pgEnum('tee_box_gender', ['male', 'female'])

export const challengeTypeEnum = pgEnum('challenge_type', [
  'closest_to_pin',
  'longest_drive',
  'most_birdies',
  'custom',
])

export const challengeScopeEnum = pgEnum('challenge_scope', [
  'hole',
  'round',
  'trip',
])

// ============================================================================
// Tables
// ============================================================================

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  location: text('location').notNull().default(''),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const golfers = pgTable('golfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  handicap: real('handicap').notNull().default(0),
  profileImageUrl: text('profile_image_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const tripGolfers = pgTable('trip_golfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  golferId: uuid('golfer_id')
    .notNull()
    .references(() => golfers.id, { onDelete: 'cascade' }),
  status: tripGolferStatusEnum('status').notNull().default('invited'),
  invitedAt: timestamp('invited_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  includedInScoring: boolean('included_in_scoring').notNull().default(true),
  handicapOverride: real('handicap_override'),
})

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiId: integer('api_id'),
  name: text('name').notNull(),
  clubName: text('club_name').notNull().default(''),
  location: text('location').notNull().default(''),
  address: text('address').notNull().default(''),
  city: text('city').notNull().default(''),
  state: text('state').notNull().default(''),
  country: text('country').notNull().default(''),
  latitude: real('latitude'),
  longitude: real('longitude'),
  courseRating: real('course_rating'),
  slopeRating: integer('slope_rating'),
  totalPar: integer('total_par').notNull().default(72),
})

export const teeBoxes = pgTable('tee_boxes', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  teeName: text('tee_name').notNull(),
  gender: teeBoxGenderEnum('gender').notNull(),
  courseRating: real('course_rating').notNull(),
  slopeRating: integer('slope_rating').notNull(),
  totalYards: integer('total_yards').notNull(),
  parTotal: integer('par_total').notNull(),
})

export const holes = pgTable('holes', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  holeNumber: integer('hole_number').notNull(),
  par: integer('par').notNull(),
  strokeIndex: integer('stroke_index').notNull(),
  yardage: integer('yardage'),
})

export const rounds = pgTable('rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  roundDate: timestamp('round_date', { withTimezone: true }).notNull(),
  roundNumber: integer('round_number').notNull().default(1),
  notes: text('notes').notNull().default(''),
  includedInScoring: boolean('included_in_scoring').notNull().default(true),
})

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundId: uuid('round_id')
    .notNull()
    .references(() => rounds.id, { onDelete: 'cascade' }),
  golferId: uuid('golfer_id')
    .notNull()
    .references(() => golfers.id, { onDelete: 'cascade' }),
  holeId: uuid('hole_id')
    .notNull()
    .references(() => holes.id, { onDelete: 'cascade' }),
  grossScore: integer('gross_score').notNull(),
  handicapStrokes: integer('handicap_strokes').notNull().default(0),
  netScore: integer('net_score').notNull(),
  stablefordPoints: integer('stableford_points').notNull().default(0),
})

export const roundSummaries = pgTable('round_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundId: uuid('round_id')
    .notNull()
    .references(() => rounds.id, { onDelete: 'cascade' }),
  golferId: uuid('golfer_id')
    .notNull()
    .references(() => golfers.id, { onDelete: 'cascade' }),
  totalGross: integer('total_gross').notNull(),
  totalNet: integer('total_net').notNull(),
  totalStableford: integer('total_stableford').notNull(),
  birdiesOrBetter: integer('birdies_or_better').notNull().default(0),
  kps: integer('kps').notNull().default(0),
  includedInScoring: boolean('included_in_scoring').notNull().default(true),
})

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3b82f6'),
})

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  golferId: uuid('golfer_id')
    .notNull()
    .references(() => golfers.id, { onDelete: 'cascade' }),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
})

export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  challengeType: challengeTypeEnum('challenge_type').notNull().default('custom'),
  scope: challengeScopeEnum('scope').notNull().default('trip'),
  roundId: uuid('round_id').references(() => rounds.id, { onDelete: 'set null' }),
  holeId: uuid('hole_id').references(() => holes.id, { onDelete: 'set null' }),
  prizeDescription: text('prize_description').notNull().default(''),
})

export const challengeResults = pgTable('challenge_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id')
    .notNull()
    .references(() => challenges.id, { onDelete: 'cascade' }),
  golferId: uuid('golfer_id')
    .notNull()
    .references(() => golfers.id, { onDelete: 'cascade' }),
  resultValue: text('result_value').notNull().default(''),
  resultNumeric: real('result_numeric'),
  isWinner: boolean('is_winner').notNull().default(false),
})
