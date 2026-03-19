import { createFileRoute } from '@tanstack/react-router'
import { Container, Flex, Heading, Text } from '@radix-ui/themes'
import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  roundCollection,
  courseCollection,
  holeCollection,
  golferCollection,
  scoreCollection,
  roundSummaryCollection,
} from '../../../../../db/collections'
import { Scorecard } from '../../../../../components/scoring/Scorecard'
import {
  getPlayingHandicap,
  getHandicapStrokes,
  calculateNetScore,
  calculateStablefordPoints,
  isBirdieOrBetter,
} from '../../../../../lib/scoring'
import type { RoundSummary } from '../../../../../db/collections'

export const Route = createFileRoute('/trips/$tripId/rounds/$roundId/scorecard')({
  ssr: false,
  component: ScorecardPage,
  validateSearch: (search: Record<string, unknown>) => ({
    golferId: search.golferId as string,
  }),
})

function ScorecardPage() {
  const { roundId } = Route.useParams()
  const { golferId } = Route.useSearch()

  const { data: rounds } = useLiveQuery(
    (q) =>
      q.from({ round: roundCollection }).where(({ round }) => eq(round.id, roundId)),
    [roundId]
  )
  const round = rounds?.[0]

  const { data: courses } = useLiveQuery(
    (q) =>
      round
        ? q
            .from({ course: courseCollection })
            .where(({ course }) => eq(course.id, round.courseId))
        : undefined,
    [round?.courseId]
  )
  const course = courses?.[0]

  const { data: holes } = useLiveQuery(
    (q) =>
      course
        ? q
            .from({ hole: holeCollection })
            .where(({ hole }) => eq(hole.courseId, course.id))
            .orderBy(({ hole }) => hole.holeNumber, 'asc')
        : undefined,
    [course?.id]
  )

  const { data: golfers } = useLiveQuery(
    (q) =>
      q
        .from({ golfer: golferCollection })
        .where(({ golfer }) => eq(golfer.id, golferId)),
    [golferId]
  )
  const golfer = golfers?.[0]

  const { data: scores } = useLiveQuery(
    (q) =>
      q
        .from({ score: scoreCollection })
        .where(({ score }) => eq(score.roundId, roundId))
        .where(({ score }) => eq(score.golferId, golferId)),
    [roundId, golferId]
  )

  function handleScoreChange(holeId: string, grossScore: number) {
    if (!golfer || !holes || !course) return

    const hole = holes.find((h) => h.id === holeId)
    if (!hole) return

    const playingHandicap = getPlayingHandicap(
      golfer.handicap,
      course.slopeRating,
      course.courseRating,
      course.totalPar
    )

    const handicapStrokes = getHandicapStrokes(hole.strokeIndex, playingHandicap)
    const netScore = calculateNetScore(grossScore, handicapStrokes)
    const stablefordPoints = calculateStablefordPoints(netScore, hole.par)

    const existingScore = scores?.find((s) => s.holeId === holeId)

    if (existingScore) {
      scoreCollection.update(existingScore.id, (draft) => {
        draft.grossScore = grossScore
        draft.handicapStrokes = handicapStrokes
        draft.netScore = netScore
        draft.stablefordPoints = stablefordPoints
      })
    } else {
      scoreCollection.insert({
        id: crypto.randomUUID(),
        roundId,
        golferId,
        holeId,
        grossScore,
        handicapStrokes,
        netScore,
        stablefordPoints,
      })
    }

    // Update round summary
    updateRoundSummary()
  }

  function updateRoundSummary() {
    if (!golfer || !holes || !course) return

    // Re-query to get latest scores
    const allScores = scores || []

    let totalGross = 0
    let totalNet = 0
    let totalStableford = 0
    let birdiesOrBetter = 0

    for (const score of allScores) {
      const hole = holes.find((h) => h.id === score.holeId)
      if (!hole) continue

      totalGross += score.grossScore
      totalNet += score.netScore
      totalStableford += score.stablefordPoints

      if (isBirdieOrBetter(score.netScore, hole.par)) {
        birdiesOrBetter++
      }
    }

    // Check for existing summary by querying the collection
    let existing: RoundSummary | undefined = undefined
    for (const [, s] of roundSummaryCollection.entries()) {
      if (s.roundId === roundId && s.golferId === golferId) {
        existing = s
        break
      }
    }

    if (existing) {
      roundSummaryCollection.update(existing.id, (draft) => {
        draft.totalGross = totalGross
        draft.totalNet = totalNet
        draft.totalStableford = totalStableford
        draft.birdiesOrBetter = birdiesOrBetter
      })
    } else if (allScores.length > 0) {
      roundSummaryCollection.insert({
        id: crypto.randomUUID(),
        roundId,
        golferId,
        totalGross,
        totalNet,
        totalStableford,
        birdiesOrBetter,
        kps: 0,
      })
    }
  }

  if (!round || !course || !golfer) {
    return (
      <Container size="2" py="6">
        <Text>Loading...</Text>
      </Container>
    )
  }

  const holeScores =
    holes?.map((hole) => {
      const score = scores?.find((s) => s.holeId === hole.id)
      return {
        holeId: hole.id,
        grossScore: score?.grossScore ?? null,
      }
    }) ?? []

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="5">
        <Flex direction="column" gap="3">
          <Heading size="6">{course.name}</Heading>
          <Text color="gray">Round {round.roundNumber}</Text>
        </Flex>

        {holes && (
          <Scorecard
            golfer={golfer}
            holes={holes}
            courseRating={course.courseRating}
            slopeRating={course.slopeRating}
            coursePar={course.totalPar}
            scores={holeScores}
            onScoreChange={handleScoreChange}
          />
        )}
      </Flex>
    </Container>
  )
}
