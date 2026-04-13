import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Container, Flex, Heading, Text, Button, Badge, Select, Card } from '@radix-ui/themes'
import { ArrowLeft, Trophy, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { useMemo, useCallback } from 'react'
import { Scorecard } from '../../../../../components/scoring/Scorecard'
import {
  getPlayingHandicap,
  getHandicapStrokes,
  calculateNetScore,
  calculateStablefordPoints,
  isBirdieOrBetter,
} from '../../../../../lib/scoring'
import { useTripRole } from '../../../../../hooks/useTripRole'
import {
  useTrip,
  useRound,
  useCourse,
  useHolesByCourseId,
  useTripGolfersByTripId,
  useGolfers,
  useScoresByRoundId,
  useRoundSummariesByRoundId,
  useCreateScore,
  useUpdateScore,
  useCreateRoundSummary,
  useUpdateRoundSummary,
} from '../../../../../hooks/queries'
import type { TripGolfer, Golfer, Score, Hole, RoundSummary } from '../../../../../db/collections'

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

  // TanStack Query hooks
  const { data: trip } = useTrip(tripId)
  const { data: round } = useRound(roundId)
  const { data: course } = useCourse(round?.courseId ?? '')
  const { data: holes } = useHolesByCourseId(course?.id ?? '')
  const { data: tripGolfers } = useTripGolfersByTripId(tripId)
  const { data: allGolfers } = useGolfers()
  const { data: allScores } = useScoresByRoundId(roundId)
  const { data: roundSummaries } = useRoundSummariesByRoundId(roundId)

  // Mutations
  const createScore = useCreateScore()
  const updateScore = useUpdateScore()
  const createRoundSummary = useCreateRoundSummary()
  const updateRoundSummaryMutation = useUpdateRoundSummary()

  // Memoize lookup maps
  const acceptedTripGolfers = useMemo(
    () => (tripGolfers ?? []).filter((tg: TripGolfer) => tg.status === 'accepted'),
    [tripGolfers]
  )

  const tripGolferIds = useMemo(
    () => acceptedTripGolfers.map((tg: TripGolfer) => tg.golferId),
    [acceptedTripGolfers]
  )

  const tripGolferMap = useMemo<Map<string, TripGolfer>>(
    () => new Map(acceptedTripGolfers.map((tg: TripGolfer) => [tg.golferId, tg])),
    [acceptedTripGolfers]
  )

  const golferMap = useMemo<Map<string, Golfer>>(
    () => new Map((allGolfers ?? []).map((g: Golfer) => [g.id, g])),
    [allGolfers]
  )

  // Get golfers in this trip, sorted by name
  const playingGolfers = useMemo<Golfer[]>(
    () => tripGolferIds
      .map((id: string) => golferMap.get(id))
      .filter((g: Golfer | undefined): g is Golfer => !!g)
      .sort((a: Golfer, b: Golfer) => a.name.localeCompare(b.name)),
    [tripGolferIds, golferMap]
  )

  const golfer = useMemo(
    () => golferMap.get(golferId),
    [golferMap, golferId]
  )

  // Filter scores for current golfer
  const scores = useMemo<Score[]>(
    () => (allScores ?? []).filter((s: Score) => s.golferId === golferId),
    [allScores, golferId]
  )

  // Find current golfer index for prev/next navigation
  const { prevGolfer, nextGolfer } = useMemo(() => {
    const index = playingGolfers.findIndex((g: Golfer) => g.id === golferId)
    return {
      prevGolfer: index > 0 ? playingGolfers[index - 1] : null,
      nextGolfer: index < playingGolfers.length - 1 ? playingGolfers[index + 1] : null,
    }
  }, [playingGolfers, golferId])

  const navigateToGolfer = useCallback((newGolferId: string) => {
    navigate({
      to: '/trips/$tripId/rounds/$roundId/scorecard',
      params: { tripId, roundId },
      search: { golferId: newGolferId },
    })
  }, [navigate, tripId, roundId])

  const updateRoundSummaryFn = useCallback(() => {
    if (!golfer || !holes || !course) return

    let totalGross = 0
    let totalNet = 0
    let totalStableford = 0
    let birdiesOrBetter = 0

    for (const score of scores) {
      const hole = holes.find((h: Hole) => h.id === score.holeId)
      if (!hole) continue

      totalGross += score.grossScore
      totalNet += score.netScore
      totalStableford += score.stablefordPoints

      if (isBirdieOrBetter(score.netScore, hole.par)) {
        birdiesOrBetter++
      }
    }

    // Check for existing summary
    const existing = roundSummaries?.find(
      (s: RoundSummary) => s.roundId === roundId && s.golferId === golferId
    )

    if (existing) {
      updateRoundSummaryMutation.mutate({
        id: existing.id,
        changes: {
          totalGross,
          totalNet,
          totalStableford,
          birdiesOrBetter,
        },
        roundId,
      })
    } else if (scores.length > 0) {
      createRoundSummary.mutate({
        id: crypto.randomUUID(),
        roundId,
        golferId,
        totalGross,
        totalNet,
        totalStableford,
        birdiesOrBetter,
        kps: 0,
        includedInScoring: true,
      })
    }
  }, [golfer, holes, course, roundId, golferId, scores, roundSummaries, updateRoundSummaryMutation, createRoundSummary])

  const handleScoreChange = useCallback((holeId: string, grossScore: number) => {
    if (!golfer || !holes || !course) return

    const hole = holes.find((h: Hole) => h.id === holeId)
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

    const existingScore = scores.find((s: Score) => s.holeId === holeId)

    if (existingScore) {
      updateScore.mutate({
        id: existingScore.id,
        changes: {
          grossScore,
          handicapStrokes,
          netScore,
          stablefordPoints,
        },
        roundId,
      }, {
        onSuccess: () => updateRoundSummaryFn(),
      })
    } else {
      createScore.mutate({
        id: crypto.randomUUID(),
        roundId,
        golferId,
        holeId,
        grossScore,
        handicapStrokes,
        netScore,
        stablefordPoints,
      }, {
        onSuccess: () => updateRoundSummaryFn(),
      })
    }
  }, [golfer, holes, course, golferId, roundId, scores, tripGolferMap, updateScore, createScore, updateRoundSummaryFn])

  // Eliminate O(n²) pattern with Map lookup
  const holeScores = useMemo(() => {
    if (!holes) return []
    const scoreMap = new Map<string, Score>(scores.map((s: Score) => [s.holeId, s]))
    return holes.map((hole: Hole) => ({
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
                  {playingGolfers.map((g: Golfer) => (
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
