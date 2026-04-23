import {
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from '@radix-ui/themes'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight, Plus } from 'lucide-react'
import { RoundDeleteButton } from '../../../../components/rounds/RoundDeleteButton'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { useTripRole } from '../../../../hooks/useTripRole'
import {
  useTrip,
  useRoundsByTripId,
  useCourses,
} from '../../../../hooks/queries'

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
  const { canManage } = useTripRole(tripId)

  const { data: trip } = useTrip(tripId)
  const { data: rounds } = useRoundsByTripId(tripId)
  const { data: courses } = useCourses()

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
          <Flex direction="column" gap="3">
            <Heading size="7">Rounds</Heading>
            <Text color="gray">{trip.name}</Text>
          </Flex>
          {canManage && (
            <Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
              <Button>
                <Plus size={16} />
                Add Round
              </Button>
            </Link>
          )}
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
                      style={{ flex: 1, textDecoration: 'none' }}
                    >
                      <Flex direction="column" gap="3">
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
                    </Link>
                    <Flex align="center" gap="2">
                      <Link
                        to="/trips/$tripId/rounds/$roundId"
                        params={{ tripId, roundId: round.id }}
                      >
                        <ChevronRight
                          size={16}
                          style={{ color: 'var(--gray-9)' }}
                        />
                      </Link>
                      {canManage && (
                        <RoundDeleteButton
                          round={round}
                          courseName={course?.name || 'Unknown Course'}
                          tripId={tripId}
                        />
                      )}
                    </Flex>
                  </Flex>
                </Card>
              )
            })}
          </Flex>
        ) : (
          <EmptyState
            action={
              canManage ? (
                <Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
                  <Button>
                    <Plus size={16} />
                    Add Round
                  </Button>
                </Link>
              ) : undefined
            }
          />
        )}
      </Flex>
    </Container>
  )
}
