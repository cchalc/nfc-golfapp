import {
  tripCollection,
  golferCollection,
  tripGolferCollection,
  courseCollection,
  holeCollection,
  roundCollection,
  scoreCollection,
  roundSummaryCollection,
  teamCollection,
  teamMemberCollection,
  type Trip,
  type Golfer,
  type TripGolfer,
  type Course,
  type Hole,
  type Round,
  type Score,
  type RoundSummary,
  type Team,
  type TeamMember,
} from './collections'
import { getPlayingHandicap, calculateHoleScore } from '../lib/scoring'

// ============================================================================
// Seed Data from CSV
// ============================================================================

// Golfer data from the CSV
const golferData: Array<{ name: string; handicap: number }> = [
  { name: 'Seef Nolte', handicap: 10.5 },
  { name: 'Sefie Nolte', handicap: 9.9 },
  { name: 'Graham Sadoway', handicap: 6.3 },
  { name: 'Peter Mukheibir', handicap: 11.7 },
  { name: 'Albert Lamprecht', handicap: 6 },
  { name: 'Sean Lamprecht', handicap: 3.4 },
  { name: 'Chris Cox', handicap: 12.4 },
  { name: 'Chris Chalcraft', handicap: 36 },
  { name: 'Steve Sadoway', handicap: 36 },
  { name: 'Aussie Matt', handicap: 11 },
]

// Course data
const courseData: Array<{
  name: string
  location: string
  totalPar: number
  slopeRating: number | null
  courseRating: number | null
}> = [
  {
    name: "Gallagher's Canyon",
    location: 'Kelowna, BC',
    totalPar: 72,
    slopeRating: 130,
    courseRating: 72.5,
  },
  {
    name: 'Okanagan Bear',
    location: 'Kelowna, BC',
    totalPar: 72,
    slopeRating: 128,
    courseRating: 71.8,
  },
  {
    name: 'Okanagan Quail',
    location: 'Kelowna, BC',
    totalPar: 72,
    slopeRating: 125,
    courseRating: 71.2,
  },
  {
    name: 'Tower Ranch',
    location: 'Kelowna, BC',
    totalPar: 72,
    slopeRating: 132,
    courseRating: 73.1,
  },
]

// Scores from CSV - map [courseIndex][golferIndex] to gross score or null if didn't play
const rawScores: Record<number, Record<number, number | null>> = {
  0: {
    // Gallagher's Canyon
    0: 85,
    1: 91,
    2: 93,
    3: 95,
    4: 84,
    5: 74,
    6: 95,
    7: 120,
    8: null,
    9: 86,
  },
  1: {
    // Okanagan Bear
    0: null,
    1: 83,
    2: 88,
    3: null,
    4: 81,
    5: 76,
    6: null,
    7: 96,
    8: null,
    9: 84,
  },
  2: {
    // Okanagan Quail
    0: 86,
    1: 81,
    2: 84,
    3: 92,
    4: 79,
    5: 86,
    6: 94,
    7: 104,
    8: 115,
    9: 88,
  },
  3: {
    // Tower Ranch
    0: 99,
    1: 89,
    2: 88,
    3: 106,
    4: 83,
    5: 78,
    6: null,
    7: 97,
    8: 108,
    9: 86,
  },
}

// KPs from CSV
const kpData: Record<number, Record<number, number>> = {
  0: { 9: 2 }, // Gallagher's - Aussie Matt 2
  1: { 5: 2 }, // Okanagan Bear - Sean 2
  2: { 0: 1, 6: 1 }, // Okanagan Quail - Seef 1, Chris Cox 1
  3: { 7: 2 }, // Tower Ranch - Chris Chalcraft 2
}

// Birdies from CSV
const birdieData: Record<number, Record<number, number>> = {
  0: { 1: 1, 5: 5, 9: 1 }, // Gallagher's
  1: { 1: 1, 2: 1, 4: 3, 5: 3, 9: 1 }, // Okanagan Bear
  2: { 0: 1, 1: 1, 2: 1, 4: 1, 5: 1, 8: 4, 9: 2 }, // Okanagan Quail
  3: { 1: 1, 2: 1, 3: 1, 4: 2, 5: 3, 7: 1, 9: 1 }, // Tower Ranch
}

// Team assignments (Team 1 and Team 2 from CSV)
const team1Members = [
  'Seef Nolte',
  'Sefie Nolte',
  'Graham Sadoway',
  'Peter Mukheibir',
  'Albert Lamprecht',
]
const team2Members = [
  'Sean Lamprecht',
  'Chris Cox',
  'Chris Chalcraft',
  'Steve Sadoway',
  'Aussie Matt',
]

// ============================================================================
// Seed function
// ============================================================================

function generateId(): string {
  return crypto.randomUUID()
}

// Generate standard 18 holes for a course
function generateHoles(courseId: string): Hole[] {
  // Standard par distribution for a par-72 course
  const pars = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5]
  // Typical stroke index pattern
  const strokeIndices = [7, 15, 3, 11, 1, 13, 5, 9, 17, 8, 16, 4, 12, 2, 14, 6, 10, 18]

  return pars.map((par, idx) => ({
    id: generateId(),
    courseId,
    holeNumber: idx + 1,
    par,
    strokeIndex: strokeIndices[idx],
    yardage: null,
  }))
}

export function seedData() {
  const now = new Date()

  // Create trip
  const tripId = generateId()
  const trip: Trip = {
    id: tripId,
    name: 'Kelowna Golf Trip 2024',
    description: 'Annual golf trip to the Okanagan Valley',
    startDate: new Date('2024-06-15'),
    endDate: new Date('2024-06-19'),
    location: 'Kelowna, BC',
    createdBy: 'system',
    createdAt: now,
  }
  tripCollection.insert(trip)

  // Create golfers
  const golferIds: string[] = []
  const golfers: Golfer[] = golferData.map((g) => {
    const id = generateId()
    golferIds.push(id)
    return {
      id,
      name: g.name,
      email: '',
      phone: '',
      handicap: g.handicap,
      profileImageUrl: null,
      createdAt: now,
    }
  })
  golferCollection.insert(golfers)

  // Create trip golfers
  const tripGolfers: TripGolfer[] = golferIds.map((golferId) => ({
    id: generateId(),
    tripId,
    golferId,
    status: 'accepted' as const,
    invitedAt: now,
    acceptedAt: now,
  }))
  tripGolferCollection.insert(tripGolfers)

  // Create courses and holes
  const courseIds: string[] = []
  const allHoles: Map<string, Hole[]> = new Map()

  courseData.forEach((c) => {
    const courseId = generateId()
    courseIds.push(courseId)

    const course: Course = {
      id: courseId,
      name: c.name,
      location: c.location,
      courseRating: c.courseRating,
      slopeRating: c.slopeRating,
      totalPar: c.totalPar,
    }
    courseCollection.insert(course)

    const holes = generateHoles(courseId)
    allHoles.set(courseId, holes)
    holeCollection.insert(holes)
  })

  // Create rounds and scores
  const roundDates = [
    new Date('2024-06-15'),
    new Date('2024-06-16'),
    new Date('2024-06-17'),
    new Date('2024-06-18'),
  ]

  courseIds.forEach((courseId, courseIdx) => {
    const roundId = generateId()
    const round: Round = {
      id: roundId,
      tripId,
      courseId,
      roundDate: roundDates[courseIdx],
      roundNumber: courseIdx + 1,
      notes: '',
    }
    roundCollection.insert(round)

    const courseHoles = allHoles.get(courseId) || []
    const course = courseData[courseIdx]
    const courseScores = rawScores[courseIdx] || {}
    const courseKps = kpData[courseIdx] || {}
    const courseBirdies = birdieData[courseIdx] || {}

    // Create scores for each golfer who played this round
    golferIds.forEach((golferId, golferIdx) => {
      const grossTotal = courseScores[golferIdx]
      if (grossTotal === null || grossTotal === undefined) return

      const golfer = golferData[golferIdx]
      const playingHandicap = getPlayingHandicap(
        golfer.handicap,
        course.slopeRating,
        course.courseRating,
        course.totalPar
      )

      // Distribute gross score across holes (simplified - evenly distribute extra strokes)
      const basePerHole = Math.floor(grossTotal / 18)
      const extraStrokes = grossTotal % 18
      const holeScores: Score[] = []

      let totalNet = 0
      let totalStableford = 0
      let totalGross = 0

      courseHoles.forEach((hole, holeIdx) => {
        // Add 1 to some holes to match total
        const gross = basePerHole + (holeIdx < extraStrokes ? 1 : 0)

        const scoreData = calculateHoleScore(gross, hole, playingHandicap)

        const score: Score = {
          id: generateId(),
          roundId,
          golferId,
          holeId: hole.id,
          ...scoreData,
        }
        holeScores.push(score)

        totalGross += scoreData.grossScore
        totalNet += scoreData.netScore
        totalStableford += scoreData.stablefordPoints
      })

      scoreCollection.insert(holeScores)

      // Create round summary
      const kps = courseKps[golferIdx] || 0
      const birdies = courseBirdies[golferIdx] || 0

      const summary: RoundSummary = {
        id: generateId(),
        roundId,
        golferId,
        totalGross,
        totalNet,
        totalStableford,
        birdiesOrBetter: birdies,
        kps,
      }
      roundSummaryCollection.insert(summary)
    })
  })

  // Create teams
  const team1Id = generateId()
  const team2Id = generateId()

  const team1: Team = {
    id: team1Id,
    tripId,
    name: 'Team 1',
    color: '#ef4444', // red
  }
  const team2: Team = {
    id: team2Id,
    tripId,
    name: 'Team 2',
    color: '#3b82f6', // blue
  }
  teamCollection.insert([team1, team2])

  // Create team members
  const teamMembers: TeamMember[] = []

  golfers.forEach((golfer) => {
    const isTeam1 = team1Members.includes(golfer.name)
    const isTeam2 = team2Members.includes(golfer.name)

    if (isTeam1) {
      teamMembers.push({
        id: generateId(),
        teamId: team1Id,
        golferId: golfer.id,
        tripId,
      })
    } else if (isTeam2) {
      teamMembers.push({
        id: generateId(),
        teamId: team2Id,
        golferId: golfer.id,
        tripId,
      })
    }
  })
  teamMemberCollection.insert(teamMembers)

  console.log('Seed data created successfully')
}
