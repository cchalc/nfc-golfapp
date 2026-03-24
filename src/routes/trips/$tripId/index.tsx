import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Grid,
  Button,
  Badge,
  Switch,
  Tooltip,
  AlertDialog,
} from '@radix-ui/themes'
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Flag,
  ChevronRight,
  Target,
  Calculator,
  Trash2,
} from 'lucide-react'
import { useLiveQuery, eq, count } from '@tanstack/react-db'
import {
  tripCollection,
  tripGolferCollection,
  roundCollection,
  courseCollection,
  challengeCollection,
} from '../../../db/collections'
import { StatCard } from '../../../components/ui/StatCard'

export const Route = createFileRoute('/trips/$tripId/')({
  ssr: false,
  component: TripDashboard,
})

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function TripDashboard() {
  const { tripId } = Route.useParams()
  const navigate = useNavigate()

  const { data: trips } = useLiveQuery(
    (q) => q.from({ trip: tripCollection }).where(({ trip }) => eq(trip.id, tripId)),
    [tripId]
  )
  const trip = trips?.[0]

  const { data: golferStats } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.tripId, tripId))
        .select(({ tg }) => ({
          total: count(tg.id),
        })),
    [tripId]
  )

  const { data: rounds } = useLiveQuery(
    (q) =>
      q
        .from({ round: roundCollection })
        .where(({ round }) => eq(round.tripId, tripId))
        .orderBy(({ round }) => round.roundNumber, 'asc'),
    [tripId]
  )

  const { data: courses } = useLiveQuery(
    (q) => q.from({ course: courseCollection }),
    []
  )

  const courseMap = new Map((courses || []).map((c) => [c.id, c]))

  // Fetch challenges for badge count
  const { data: challenges } = useLiveQuery(
    (q) =>
      q
        .from({ challenge: challengeCollection })
        .where(({ challenge }) => eq(challenge.tripId, tripId)),
    [tripId]
  )
  const challengeCount = challenges?.length ?? 0

  if (!trip) {
    return (
      <Container size="2" py="6">
        <Text>Trip not found</Text>
      </Container>
    )
  }

  const golferCount = golferStats?.[0]?.total ?? 0
  const roundCount = rounds?.length ?? 0
  const includedRoundCount = rounds?.filter((r) => r.includedInScoring).length ?? 0

  function toggleRoundScoring(roundId: string, currentValue: boolean) {
    roundCollection.update(roundId, (draft) => {
      draft.includedInScoring = !currentValue
    })
  }

  function handleDeleteTrip() {
    tripCollection.delete(tripId)
    navigate({ to: '/trips' })
  }

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="6">
        {/* Header */}
        <Flex direction="column" gap="3">
          <Flex justify="between" align="start">
            <Heading size="8">{trip.name}</Heading>
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <Button variant="soft" color="red" size="1">
                  <Trash2 size={14} />
                  Delete Trip
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content maxWidth="450px">
                <AlertDialog.Title>Delete Trip</AlertDialog.Title>
                <AlertDialog.Description size="2">
                  Are you sure you want to delete "{trip.name}"? This will permanently remove all
                  rounds, scores, and challenges associated with this trip. This action cannot be
                  undone.
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">
                      Cancel
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button variant="solid" color="red" onClick={handleDeleteTrip}>
                      Delete Trip
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </Flex>
          {trip.description && (
            <Text size="3" color="gray">
              {trip.description}
            </Text>
          )}
          <Flex gap="4" wrap="wrap">
            <Flex align="center" gap="1">
              <Calendar size={16} />
              <Text size="2">
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </Text>
            </Flex>
            {trip.location && (
              <Flex align="center" gap="1">
                <MapPin size={16} />
                <Text size="2">{trip.location}</Text>
              </Flex>
            )}
          </Flex>
        </Flex>

        {/* Stats */}
        <Grid columns={{ initial: '1', sm: '3' }} gap="3">
          <StatCard label="Golfers" value={golferCount} />
          <StatCard
            label="Rounds"
            value={includedRoundCount === roundCount ? roundCount : `${includedRoundCount}/${roundCount}`}
          />
          <StatCard label="Courses" value={new Set(rounds?.map((r) => r.courseId)).size} />
        </Grid>

        {/* Quick Links */}
        <Flex direction="column" gap="3">
          <Heading size="4">Manage</Heading>
          <Grid columns={{ initial: '1', sm: '2' }} gap="3">
            <Link to="/trips/$tripId/golfers" params={{ tripId }}>
              <Card asChild>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <Users size={20} />
                    <Text weight="medium">Golfers</Text>
                  </Flex>
                  <ChevronRight size={16} />
                </Flex>
              </Card>
            </Link>

            <Link to="/trips/$tripId/leaderboards" params={{ tripId }}>
              <Card asChild>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <Trophy size={20} />
                    <Text weight="medium">Leaderboards</Text>
                  </Flex>
                  <ChevronRight size={16} />
                </Flex>
              </Card>
            </Link>

            <Link to="/trips/$tripId/teams" params={{ tripId }}>
              <Card asChild>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <Flag size={20} />
                    <Text weight="medium">Teams</Text>
                  </Flex>
                  <ChevronRight size={16} />
                </Flex>
              </Card>
            </Link>

            <Link to="/trips/$tripId/challenges" params={{ tripId }}>
              <Card asChild>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <Target size={20} />
                    <Text weight="medium">Challenges</Text>
                    {challengeCount > 0 && (
                      <Badge size="1" color="amber">
                        {challengeCount}
                      </Badge>
                    )}
                  </Flex>
                  <ChevronRight size={16} />
                </Flex>
              </Card>
            </Link>

            <Link to="/trips/$tripId/rounds" params={{ tripId }}>
              <Card asChild>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <Calendar size={20} />
                    <Text weight="medium">All Rounds</Text>
                  </Flex>
                  <ChevronRight size={16} />
                </Flex>
              </Card>
            </Link>
          </Grid>
        </Flex>

        {/* Rounds */}
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Heading size="4">Rounds</Heading>
            <Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
              <Button variant="soft" size="1">
                Add Round
              </Button>
            </Link>
          </Flex>

          {rounds && rounds.length > 0 ? (
            <Flex direction="column" gap="2">
              {rounds.map((round) => {
                const course = courseMap.get(round.courseId)
                return (
                  <Card key={round.id}>
                    <Flex justify="between" align="center">
                      <Link
                        to="/trips/$tripId/rounds/$roundId"
                        params={{ tripId, roundId: round.id }}
                        style={{ flex: 1 }}
                      >
                        <Flex direction="column" gap="3">
                          <Flex align="center" gap="2">
                            <Badge>Round {round.roundNumber}</Badge>
                            <Text weight="medium">{course?.name || 'Unknown Course'}</Text>
                          </Flex>
                          <Text size="2" color="gray">
                            {formatDate(round.roundDate)}
                          </Text>
                        </Flex>
                      </Link>
                      <Flex align="center" gap="3">
                        <Tooltip content={round.includedInScoring ? 'Included in scoring' : 'Excluded from scoring'}>
                          <Flex
                            align="center"
                            gap="2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Calculator
                              size={14}
                              style={{
                                color: round.includedInScoring ? 'var(--grass-9)' : 'var(--gray-8)',
                              }}
                            />
                            <Switch
                              size="1"
                              checked={round.includedInScoring}
                              onCheckedChange={() =>
                                toggleRoundScoring(round.id, round.includedInScoring)
                              }
                            />
                          </Flex>
                        </Tooltip>
                        <Link
                          to="/trips/$tripId/rounds/$roundId"
                          params={{ tripId, roundId: round.id }}
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </Flex>
                    </Flex>
                  </Card>
                )
              })}
            </Flex>
          ) : (
            <Card>
              <Flex direction="column" align="center" gap="2" py="4">
                <Text color="gray">No rounds yet</Text>
                <Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
                  <Button variant="soft" size="1">
                    Add First Round
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
