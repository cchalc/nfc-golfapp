import {
  startOfflineExecutor,
  NonRetriableError,
} from '@tanstack/offline-transactions'
import { isRetriable } from '../lib/errors'
import {
  tripCollection,
  golferCollection,
  tripGolferCollection,
  courseCollection,
  teeBoxCollection,
  holeCollection,
  roundCollection,
  scoreCollection,
  roundSummaryCollection,
  teamCollection,
  teamMemberCollection,
  challengeCollection,
  challengeResultCollection,
  type Trip,
  type Golfer,
  type TripGolfer,
  type Course,
  type TeeBox,
  type Hole,
  type Round,
  type Score,
  type RoundSummary,
  type Team,
  type TeamMember,
  type Challenge,
  type ChallengeResult,
} from './collections'
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

/**
 * Wrap a mutation call with error classification for offline transactions.
 * Throws NonRetriableError for permanent failures.
 */
async function withErrorClassification<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (!isRetriable(error)) {
      throw new NonRetriableError(`${operation} failed (permanent)`)
    }
    throw error
  }
}

/**
 * Create the offline executor with all collections and mutation functions.
 * This must be initialized once at app startup.
 */
export function createOfflineExecutor() {
  return startOfflineExecutor({
    // All synced collections for optimistic state restoration
    collections: {
      trips: tripCollection,
      golfers: golferCollection,
      trip_golfers: tripGolferCollection,
      courses: courseCollection,
      tee_boxes: teeBoxCollection,
      holes: holeCollection,
      rounds: roundCollection,
      scores: scoreCollection,
      round_summaries: roundSummaryCollection,
      teams: teamCollection,
      team_members: teamMemberCollection,
      challenges: challengeCollection,
      challenge_results: challengeResultCollection,
    },

    // Mutation functions for all entities
    mutationFns: {
      // Trips
      insertTrip: async ({ transaction }) => {
        const trip = transaction.mutations[0].modified as Trip
        await withErrorClassification('insertTrip', () =>
          insertTrip({ data: trip })
        )
      },
      updateTrip: async ({ transaction }) => {
        const trip = transaction.mutations[0].modified as Trip
        await withErrorClassification('updateTrip', () =>
          updateTrip({ data: { id: trip.id, changes: trip } })
        )
      },
      deleteTrip: async ({ transaction }) => {
        const trip = transaction.mutations[0].original as Trip
        await withErrorClassification('deleteTrip', () =>
          deleteTrip({ data: { id: trip.id } })
        )
      },

      // Golfers
      insertGolfer: async ({ transaction }) => {
        const golfer = transaction.mutations[0].modified as Golfer
        await withErrorClassification('insertGolfer', () =>
          insertGolfer({ data: golfer })
        )
      },
      updateGolfer: async ({ transaction }) => {
        const golfer = transaction.mutations[0].modified as Golfer
        await withErrorClassification('updateGolfer', () =>
          updateGolfer({ data: { id: golfer.id, changes: golfer } })
        )
      },
      deleteGolfer: async ({ transaction }) => {
        const golfer = transaction.mutations[0].original as Golfer
        await withErrorClassification('deleteGolfer', () =>
          deleteGolfer({ data: { id: golfer.id } })
        )
      },

      // TripGolfers
      insertTripGolfer: async ({ transaction }) => {
        const tripGolfer = transaction.mutations[0].modified as TripGolfer
        await withErrorClassification('insertTripGolfer', () =>
          insertTripGolfer({ data: tripGolfer })
        )
      },
      updateTripGolfer: async ({ transaction }) => {
        const tripGolfer = transaction.mutations[0].modified as TripGolfer
        await withErrorClassification('updateTripGolfer', () =>
          updateTripGolfer({ data: { id: tripGolfer.id, changes: tripGolfer } })
        )
      },
      deleteTripGolfer: async ({ transaction }) => {
        const tripGolfer = transaction.mutations[0].original as TripGolfer
        await withErrorClassification('deleteTripGolfer', () =>
          deleteTripGolfer({ data: { id: tripGolfer.id } })
        )
      },

      // Courses
      insertCourse: async ({ transaction }) => {
        const course = transaction.mutations[0].modified as Course
        await withErrorClassification('insertCourse', () =>
          insertCourse({ data: course })
        )
      },
      updateCourse: async ({ transaction }) => {
        const course = transaction.mutations[0].modified as Course
        await withErrorClassification('updateCourse', () =>
          updateCourse({ data: { id: course.id, changes: course } })
        )
      },
      deleteCourse: async ({ transaction }) => {
        const course = transaction.mutations[0].original as Course
        await withErrorClassification('deleteCourse', () =>
          deleteCourse({ data: { id: course.id } })
        )
      },

      // TeeBoxes
      insertTeeBox: async ({ transaction }) => {
        const teeBox = transaction.mutations[0].modified as TeeBox
        await withErrorClassification('insertTeeBox', () =>
          insertTeeBox({ data: teeBox })
        )
      },
      updateTeeBox: async ({ transaction }) => {
        const teeBox = transaction.mutations[0].modified as TeeBox
        await withErrorClassification('updateTeeBox', () =>
          updateTeeBox({ data: { id: teeBox.id, changes: teeBox } })
        )
      },
      deleteTeeBox: async ({ transaction }) => {
        const teeBox = transaction.mutations[0].original as TeeBox
        await withErrorClassification('deleteTeeBox', () =>
          deleteTeeBox({ data: { id: teeBox.id } })
        )
      },

      // Holes
      insertHole: async ({ transaction }) => {
        const hole = transaction.mutations[0].modified as Hole
        await withErrorClassification('insertHole', () =>
          insertHole({ data: hole })
        )
      },
      updateHole: async ({ transaction }) => {
        const hole = transaction.mutations[0].modified as Hole
        await withErrorClassification('updateHole', () =>
          updateHole({ data: { id: hole.id, changes: hole } })
        )
      },
      deleteHole: async ({ transaction }) => {
        const hole = transaction.mutations[0].original as Hole
        await withErrorClassification('deleteHole', () =>
          deleteHole({ data: { id: hole.id } })
        )
      },

      // Rounds
      insertRound: async ({ transaction }) => {
        const round = transaction.mutations[0].modified as Round
        await withErrorClassification('insertRound', () =>
          insertRound({ data: round })
        )
      },
      updateRound: async ({ transaction }) => {
        const round = transaction.mutations[0].modified as Round
        await withErrorClassification('updateRound', () =>
          updateRound({ data: { id: round.id, changes: round } })
        )
      },
      deleteRound: async ({ transaction }) => {
        const round = transaction.mutations[0].original as Round
        await withErrorClassification('deleteRound', () =>
          deleteRound({ data: { id: round.id } })
        )
      },

      // Scores (most important for on-course use)
      insertScore: async ({ transaction }) => {
        const score = transaction.mutations[0].modified as Score
        await withErrorClassification('insertScore', () =>
          insertScore({ data: score })
        )
      },
      updateScore: async ({ transaction }) => {
        const score = transaction.mutations[0].modified as Score
        await withErrorClassification('updateScore', () =>
          updateScore({ data: { id: score.id, changes: score } })
        )
      },
      deleteScore: async ({ transaction }) => {
        const score = transaction.mutations[0].original as Score
        await withErrorClassification('deleteScore', () =>
          deleteScore({ data: { id: score.id } })
        )
      },

      // RoundSummaries
      insertRoundSummary: async ({ transaction }) => {
        const summary = transaction.mutations[0].modified as RoundSummary
        await withErrorClassification('insertRoundSummary', () =>
          insertRoundSummary({ data: summary })
        )
      },
      updateRoundSummary: async ({ transaction }) => {
        const summary = transaction.mutations[0].modified as RoundSummary
        await withErrorClassification('updateRoundSummary', () =>
          updateRoundSummary({ data: { id: summary.id, changes: summary } })
        )
      },
      deleteRoundSummary: async ({ transaction }) => {
        const summary = transaction.mutations[0].original as RoundSummary
        await withErrorClassification('deleteRoundSummary', () =>
          deleteRoundSummary({ data: { id: summary.id } })
        )
      },

      // Teams
      insertTeam: async ({ transaction }) => {
        const team = transaction.mutations[0].modified as Team
        await withErrorClassification('insertTeam', () =>
          insertTeam({ data: team })
        )
      },
      updateTeam: async ({ transaction }) => {
        const team = transaction.mutations[0].modified as Team
        await withErrorClassification('updateTeam', () =>
          updateTeam({ data: { id: team.id, changes: team } })
        )
      },
      deleteTeam: async ({ transaction }) => {
        const team = transaction.mutations[0].original as Team
        await withErrorClassification('deleteTeam', () =>
          deleteTeam({ data: { id: team.id } })
        )
      },

      // TeamMembers
      insertTeamMember: async ({ transaction }) => {
        const teamMember = transaction.mutations[0].modified as TeamMember
        await withErrorClassification('insertTeamMember', () =>
          insertTeamMember({ data: teamMember })
        )
      },
      deleteTeamMember: async ({ transaction }) => {
        const teamMember = transaction.mutations[0].original as TeamMember
        await withErrorClassification('deleteTeamMember', () =>
          deleteTeamMember({ data: { id: teamMember.id } })
        )
      },

      // Challenges
      insertChallenge: async ({ transaction }) => {
        const challenge = transaction.mutations[0].modified as Challenge
        await withErrorClassification('insertChallenge', () =>
          insertChallenge({ data: challenge })
        )
      },
      updateChallenge: async ({ transaction }) => {
        const challenge = transaction.mutations[0].modified as Challenge
        await withErrorClassification('updateChallenge', () =>
          updateChallenge({ data: { id: challenge.id, changes: challenge } })
        )
      },
      deleteChallenge: async ({ transaction }) => {
        const challenge = transaction.mutations[0].original as Challenge
        await withErrorClassification('deleteChallenge', () =>
          deleteChallenge({ data: { id: challenge.id } })
        )
      },

      // ChallengeResults
      insertChallengeResult: async ({ transaction }) => {
        const result = transaction.mutations[0].modified as ChallengeResult
        await withErrorClassification('insertChallengeResult', () =>
          insertChallengeResult({ data: result })
        )
      },
      updateChallengeResult: async ({ transaction }) => {
        const result = transaction.mutations[0].modified as ChallengeResult
        await withErrorClassification('updateChallengeResult', () =>
          updateChallengeResult({ data: { id: result.id, changes: result } })
        )
      },
      deleteChallengeResult: async ({ transaction }) => {
        const result = transaction.mutations[0].original as ChallengeResult
        await withErrorClassification('deleteChallengeResult', () =>
          deleteChallengeResult({ data: { id: result.id } })
        )
      },
    },

    // Callbacks for monitoring
    onLeadershipChange: (isLeader) => {
      console.log(
        isLeader
          ? '[Offline] This tab is processing offline transactions'
          : '[Offline] Another tab is leader'
      )
    },
    onStorageFailure: (diagnostic) => {
      console.warn('[Offline] Storage unavailable:', diagnostic.message)
    },
  })
}

// Singleton executor instance
let _executor: ReturnType<typeof createOfflineExecutor> | null = null

/**
 * Get or create the singleton offline executor.
 * Must be initialized with initOffline() before use.
 */
export function getOfflineExecutor() {
  if (!_executor) {
    throw new Error(
      'Offline executor not initialized. Call initOffline() first.'
    )
  }
  return _executor
}

/**
 * Initialize the offline executor.
 * Call this once at app startup (e.g., in DataLoader).
 */
export async function initOffline() {
  if (_executor) return _executor

  _executor = createOfflineExecutor()
  await _executor.waitForInit()
  return _executor
}
