import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Container, Flex, Heading, Text, Button, Badge, Select, Card } from '@radix-ui/themes'
import { ArrowLeft, Trophy, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { useMemo, useCallback } from 'react'
import {
  roundCollection,
  courseCollection,
  holeCollection,
  golferCollection,
  scoreCollection,
  roundSummaryCollection,
  tripCollection,
  tripGolferCollection,
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
import { useTripRole } from '../../../../../hooks/useTripRole'

export const Route = createFileRoute('/trips/$tripId/rounds/$roundId/scorecard')({
  ssr: false,
  component: ScorecardPage,
  validateSearch: (search: Record<string, unknown>) => ({
    golferId: search.golferId as string,
  }),
})

function ScorecardPage() {
  const { tripId, roundId } = Route.useParams()
  const { golferId } = Route.useSearch()
  const navigate = useNavigate()
  const { access, canManage } = useTripRole(tripId)

  // Per-golfer edit permission: organizers can edit all, participants can only edit their own
  const canEditGolfer = (targetGolferId: string): boolean => {
    return canManage || access?.golferId === targetGolferId
  }

  const { data: trips } = useLiveQuery(
    (q) => q.from({ trip: tripCollection }).where(({ trip }) => eq(trip.id, tripId)),
    [tripId]
  )
  const trip = trips?.[0]

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

  // Get all golfers in this trip
  const { data: tripGolfers } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.tripId, tripId))
        .where(({ tg }) => eq(tg.status, 'accepted')),
    [tripId]
  )

  // Memoize lookup maps
  const tripGolferIds = useMemo(
    () => (tripGolfers || []).map((tg) => tg.golferId),
    [tripGolfers]
  )

  const tripGolferMap = useMemo(
    () => new Map((tripGolfers || []).map((tg) => [tg.golferId, tg])),
    [tripGolfers]
  )

  const { data: allGolfers } = useLiveQuery(
    (q) => q.from({ golfer: golferCollection }).orderBy(({ golfer }) => golfer.name, 'asc'),
    []
  )

  const golferMap = useMemo(
    () => new Map((allGolfers || []).map((g) => [g.id, g])),
    [allGolfers]
  )

  // Get golfers in this trip, sorted by name
  const playingGolfers = useMemo(
    () => tripGolferIds
      .map((id) => golferMap.get(id))
      .filter((g): g is NonNullable<typeof g> => !!g)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [tripGolferIds, golferMap]
  )

  const golfer = useMemo(
    () => golferMap.get(golferId),
    [golferMap, golferId]
  )

  // Find current golfer index for prev/next navigation
  const { prevGolfer, nextGolfer } = useMemo(() => {
    const index = playingGolfers.findIndex((g) => g.id === golferId)
    return {
      prevGolfer: index > 0 ? playingGolfers[index - 1] : null,
      nextGolfer: index < playingGolfers.length - 1 ? playingGolfers[index + 1] : null,
    }
  }, [playingGolfers, golferId])

  const { data: scores } = useLiveQuery(
    (q) =>
      q
        .from({ score: scoreCollection })
        .where(({ score }) => eq(score.roundId, roundId))
        .where(({ score }) => eq(score.golferId, golferId)),
    [roundId, golferId]
  )

  const navigateToGolfer = useCallback((newGolferId: string) => {
    navigate({
      to: '/trips/$tripId/rounds/$roundId/scorecard',
      params: { tripId, roundId },
      search: { golferId: newGolferId },
    })
  }, [navigate, tripId, roundId])

  const updateRoundSummary = useCallback(() => {
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
  }, [golfer, holes, course, roundId, golferId, scores])

  const handleScoreChange = useCallback((holeId: string, grossScore: number) => {
    if (!golfer || !holes || !course) return

    const hole = holes.find((h) => h.id === holeId)
    if (!hole) return

    // Use trip handicap override if set
    const tripGolfer = tripGolferMap.get(golferId)
    const effectiveHandicap = tripGolfer?.handicapOverride ?? golfer.handicap

    const playingHandicap = getPlayingHandicap(
      effectiveHandicap,
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
  }, [golfer, holes, course, golferId, roundId, scores, tripGolferMap, updateRoundSummary])

  // Eliminate O(n²) pattern with Map lookup
  const holeScores = useMemo(() => {
    if (!holes) return []
    const scoreMap = new Map(scores?.map(s => [s.holeId, s]) || [])
    return holes.map((hole) => ({
      holeId: hole.id,
      grossScore: scoreMap.get(hole.id)?.grossScore ?? null,
    }))
  }, [holes, scores])

  if (!round || !course || !golfer) {
    return (
      <Container size="2" py="6">
        <Text>Loading...</Text>
      </Container>
    )
  }

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="5">
        {/* Navigation breadcrumb */}
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Link to="/trips/$tripId/rounds/$roundId" params={{ tripId, roundId }}>
            <Button variant="ghost" size="1">
              <ArrowLeft size={16} />
              Back to Round
            </Button>
          </Link>
          <Flex gap="2">
            <Link to="/trips/$tripId/leaderboards" params={{ tripId }}>
              <Button variant="soft" size="1">
                <Trophy size={14} />
                Leaderboard
              </Button>
            </Link>
            <Link to="/trips/$tripId" params={{ tripId }}>
              <Button variant="soft" size="1">
                {trip?.name || 'Trip'}
              </Button>
            </Link>
          </Flex>
        </Flex>

        {/* Header with course and round info */}
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Badge size="2">Round {round.roundNumber}</Badge>
            <Heading size="6">{course.name}</Heading>
          </Flex>
          <Text size="2" color="gray">{trip?.name}</Text>
        </Flex>

        {/* Golfer selector with prev/next */}
        <Card>
          <Flex justify="between" align="center">
            <Button
              variant="ghost"
              size="1"
              disabled={!prevGolfer}
              onClick={() => prevGolfer && navigateToGolfer(prevGolfer.id)}
            >
              <ChevronLeft size={16} />
              {prevGolfer?.name.split(' ')[0] || 'Prev'}
            </Button>

            <Flex direction="column" align="center" gap="1">
              <Select.Root value={golferId} onValueChange={navigateToGolfer}>
                <Select.Trigger>
                  <Flex align="center" gap="2">
                    <Users size={14} />
                    {golfer?.name}
                  </Flex>
                </Select.Trigger>
                <Select.Content>
                  {playingGolfers.map((g) => (
                    <Select.Item key={g.id} value={g.id}>
                      {g.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              <Text size="1" color="gray">
                HCP {(tripGolferMap.get(golferId)?.handicapOverride ?? golfer?.handicap)?.toFixed(1)}
                {tripGolferMap.get(golferId)?.handicapOverride !== null &&
                  tripGolferMap.get(golferId)?.handicapOverride !== undefined && (
                    <span style={{ color: 'var(--amber-9)' }}> (trip)</span>
                  )}
              </Text>
            </Flex>

            <Button
              variant="ghost"
              size="1"
              disabled={!nextGolfer}
              onClick={() => nextGolfer && navigateToGolfer(nextGolfer.id)}
            >
              {nextGolfer?.name.split(' ')[0] || 'Next'}
              <ChevronRight size={16} />
            </Button>
          </Flex>
        </Card>

        {holes && (
          <Scorecard
            golfer={golfer}
            holes={holes}
            courseRating={course.courseRating}
            slopeRating={course.slopeRating}
            coursePar={course.totalPar}
            scores={holeScores}
            onScoreChange={handleScoreChange}
            handicapOverride={tripGolferMap.get(golferId)?.handicapOverride}
            readOnly={!canEditGolfer(golferId)}
          />
        )}
      </Flex>
    </Container>
  )
}
