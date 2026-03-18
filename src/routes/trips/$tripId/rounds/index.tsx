import { createFileRoute, Link } from '@tanstack/react-router'
import { Container, Flex, Heading, Button, Card, Text, Badge } from '@radix-ui/themes'
import { Plus, ChevronRight } from 'lucide-react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  tripCollection,
  roundCollection,
  courseCollection,
} from '../../../../db/collections'
import { EmptyState } from '../../../../components/ui/EmptyState'

export const Route = createFileRoute('/trips/$tripId/rounds/')({
  ssr: false,
  component: RoundsPage,
})

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function RoundsPage() {
  const { tripId } = Route.useParams()

  const { data: trips } = useLiveQuery(
    (q) => q.from({ trip: tripCollection }).where(({ trip }) => eq(trip.id, tripId)),
    [tripId]
  )
  const trip = trips?.[0]

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

  if (!trip) {
    return (
      <Container size="2" py="6">
        <Text>Trip not found</Text>
      </Container>
    )
  }

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="5">
        <Flex justify="between" align="center">
          <Flex direction="column" gap="2">
            <Heading size="7">Rounds</Heading>
            <Text color="gray">{trip.name}</Text>
          </Flex>
          <Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
            <Button>
              <Plus size={16} />
              Add Round
            </Button>
          </Link>
        </Flex>

        {rounds && rounds.length > 0 ? (
          <Flex direction="column" gap="2">
            {rounds.map((round) => {
              const course = courseMap.get(round.courseId)
              return (
                <Link
                  key={round.id}
                  to="/trips/$tripId/rounds/$roundId"
                  params={{ tripId, roundId: round.id }}
                >
                  <Card asChild>
                    <Flex justify="between" align="center">
                      <Flex direction="column" gap="2">
                        <Flex align="center" gap="2">
                          <Badge>Round {round.roundNumber}</Badge>
                          <Text weight="medium">
                            {course?.name || 'Unknown Course'}
                          </Text>
                        </Flex>
                        <Text size="2" color="gray">
                          {formatDate(round.roundDate)}
                        </Text>
                        {round.notes && (
                          <Text size="2" color="gray">
                            {round.notes}
                          </Text>
                        )}
                      </Flex>
                      <ChevronRight size={16} />
                    </Flex>
                  </Card>
                </Link>
              )
            })}
          </Flex>
        ) : (
          <EmptyState
            title="No rounds yet"
            description="Add your first round to start tracking scores"
            action={
              <Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
                <Button>
                  <Plus size={16} />
                  Add Round
                </Button>
              </Link>
            }
          />
        )}
      </Flex>
    </Container>
  )
}
