import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Badge,
  Button,
  Grid,
} from '@radix-ui/themes'
import { ChevronRight, ArrowLeft, Trophy } from 'lucide-react'
import { useMemo } from 'react'
import {
  useRound,
  useCourse,
  useTripGolfersByTripId,
  useGolfers,
  useRoundSummariesByRoundId,
} from '../../../../../hooks/queries'

export const Route = createFileRoute('/trips/$tripId/rounds/$roundId/')({
  ssr: false,
  component: RoundOverview,
})

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function RoundOverview() {
  const { tripId, roundId } = Route.useParams()

  const { data: round } = useRound(roundId)
  const { data: course } = useCourse(round?.courseId || '')
  const { data: tripGolfers } = useTripGolfersByTripId(tripId)
  const { data: golfers } = useGolfers()
  const { data: summaries } = useRoundSummariesByRoundId(roundId)

  const acceptedTripGolfers = useMemo(
    () => (tripGolfers || []).filter((tg) => tg.status === 'accepted'),
    [tripGolfers]
  )

  const golferIds = useMemo(
    () => acceptedTripGolfers.map((tg) => tg.golferId),
    [acceptedTripGolfers]
  )

  const summaryMap = useMemo(
    () => new Map((summaries || []).map((s) => [s.golferId, s])),
    [summaries]
  )

  const golferMap = useMemo(
    () => new Map((golfers || []).map((g) => [g.id, g])),
    [golfers]
  )

  const playingGolfers = useMemo(
    () =>
      golferIds
        .map((id) => golferMap.get(id))
        .filter((g): g is NonNullable<typeof g> => !!g)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [golferIds, golferMap]
  )

  if (!round) {
    return (
      <Container size="2" py="6">
        <Text>Round not found</Text>
      </Container>
    )
  }

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="5">
        {/* Navigation */}
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Link to="/trips/$tripId" params={{ tripId }}>
            <Button variant="ghost" size="1">
              <ArrowLeft size={16} />
              Back to Trip
            </Button>
          </Link>
          <Link to="/trips/$tripId/leaderboards" params={{ tripId }}>
            <Button variant="soft" size="1">
              <Trophy size={14} />
              Leaderboard
            </Button>
          </Link>
        </Flex>

        {/* Header */}
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <Badge size="2">Round {round.roundNumber}</Badge>
          </Flex>
          <Heading size="7">{course?.name || 'Unknown Course'}</Heading>
          <Text color="gray">{formatDate(round.roundDate)}</Text>
          {round.notes && <Text size="2">{round.notes}</Text>}
        </Flex>

        {/* Course Info */}
        {course && (
          <Card>
            <Grid columns={{ initial: '1', sm: '3' }} gap="3">
              <Flex direction="column" align="center" gap="2">
                <Text size="1" color="gray">
                  Par
                </Text>
                <Text size="4" weight="bold">
                  {course.totalPar}
                </Text>
              </Flex>
              <Flex direction="column" align="center" gap="2">
                <Text size="1" color="gray">
                  Rating
                </Text>
                <Text size="4" weight="bold">
                  {course.courseRating ?? '-'}
                </Text>
              </Flex>
              <Flex direction="column" align="center" gap="2">
                <Text size="1" color="gray">
                  Slope
                </Text>
                <Text size="4" weight="bold">
                  {course.slopeRating ?? '-'}
                </Text>
              </Flex>
            </Grid>
          </Card>
        )}

        {/* Golfers & Scores */}
        <Flex direction="column" gap="3">
          <Heading size="4">Scorecards</Heading>

          {playingGolfers.length > 0 ? (
            <Flex direction="column" gap="2">
              {playingGolfers.map((golfer) => {
                const summary = summaryMap.get(golfer.id)
                return (
                  <Link
                    key={golfer.id}
                    to="/trips/$tripId/rounds/$roundId/scorecard"
                    params={{ tripId, roundId }}
                    search={{ golferId: golfer.id }}
                    style={{ textDecoration: 'none' }}
                  >
                    <Card style={{ cursor: 'pointer' }}>
                      <Flex justify="between" align="center">
                        <Flex direction="column" gap="3">
                          <Text weight="medium">{golfer.name}</Text>
                          <Text size="2" color="gray">
                            HCP {golfer.handicap.toFixed(1)}
                          </Text>
                        </Flex>
                        <Flex align="center" gap="3">
                          {summary ? (
                            <Flex gap="2">
                              <Badge variant="soft">Gross {summary.totalGross}</Badge>
                              <Badge variant="soft" color="blue">
                                Net {summary.totalNet}
                              </Badge>
                              <Badge variant="soft" color="green">
                                {summary.totalStableford} pts
                              </Badge>
                            </Flex>
                          ) : (
                            <Badge variant="soft" color="gray">
                              No scores
                            </Badge>
                          )}
                          <ChevronRight size={16} />
                        </Flex>
                      </Flex>
                    </Card>
                  </Link>
                )
              })}
            </Flex>
          ) : (
            <Card>
              <Flex direction="column" align="center" gap="2" py="4">
                <Text color="gray">No golfers in this trip</Text>
                <Link to="/trips/$tripId/golfers" params={{ tripId }}>
                  <Button variant="soft" size="1">
                    Add Golfers
                  </Button>
                </Link>
              </Flex>
            </Card>
          )}
        </Flex>
      </Flex>
    </Container>
  )
}
