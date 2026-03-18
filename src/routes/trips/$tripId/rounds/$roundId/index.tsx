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
import { ChevronRight } from 'lucide-react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  roundCollection,
  courseCollection,
  tripGolferCollection,
  golferCollection,
  roundSummaryCollection,
} from '../../../../../db/collections'

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

  const { data: tripGolfers } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.tripId, tripId))
        .where(({ tg }) => eq(tg.status, 'accepted')),
    [tripId]
  )

  const golferIds = (tripGolfers || []).map((tg) => tg.golferId)

  const { data: golfers } = useLiveQuery(
    (q) =>
      q.from({ golfer: golferCollection }).orderBy(({ golfer }) => golfer.name, 'asc'),
    []
  )

  const { data: summaries } = useLiveQuery(
    (q) =>
      q
        .from({ summary: roundSummaryCollection })
        .where(({ summary }) => eq(summary.roundId, roundId)),
    [roundId]
  )

  const summaryMap = new Map((summaries || []).map((s) => [s.golferId, s]))
  const golferMap = new Map((golfers || []).map((g) => [g.id, g]))

  const playingGolfers = golferIds
    .map((id) => golferMap.get(id))
    .filter((g): g is NonNullable<typeof g> => !!g)

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
        {/* Header */}
        <Flex direction="column" gap="2">
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
            <Grid columns="3" gap="3">
              <Flex direction="column" align="center">
                <Text size="1" color="gray">
                  Par
                </Text>
                <Text size="4" weight="bold">
                  {course.totalPar}
                </Text>
              </Flex>
              <Flex direction="column" align="center">
                <Text size="1" color="gray">
                  Rating
                </Text>
                <Text size="4" weight="bold">
                  {course.courseRating ?? '-'}
                </Text>
              </Flex>
              <Flex direction="column" align="center">
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
                  >
                    <Card asChild>
                      <Flex justify="between" align="center">
                        <Flex direction="column" gap="2">
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
