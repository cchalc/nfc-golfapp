import { createFileRoute } from '@tanstack/react-router'
import { Container, Flex, Heading, Button } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useLiveQuery, eq, count } from '@tanstack/react-db'
import { tripCollection, tripGolferCollection } from '../../db/collections'
import { TripCard } from '../../components/trips/TripCard'
import { EmptyState } from '../../components/ui/EmptyState'

export const Route = createFileRoute('/trips/')({
  ssr: false,
  component: TripsPage,
})

function TripsPage() {
  const { data: trips, isLoading } = useLiveQuery(
    (q) =>
      q.from({ trip: tripCollection }).orderBy(({ trip }) => trip.startDate, 'desc'),
    []
  )

  const { data: tripGolfers } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.status, 'accepted'))
        .groupBy(({ tg }) => tg.tripId)
        .select(({ tg }) => ({
          tripId: tg.tripId,
          count: count(tg.id),
        })),
    []
  )

  const golferCountByTrip = new Map(
    (tripGolfers || []).map((tg) => [tg.tripId, tg.count])
  )

  if (isLoading) {
    return (
      <Container size="2" py="6">
        <Flex direction="column" gap="4">
          <Heading size="7">Trips</Heading>
          <Flex align="center" justify="center" py="9">
            Loading...
          </Flex>
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="7">Trips</Heading>
          <Link to="/trips/new">
            <Button>
              <Plus size={16} />
              New Trip
            </Button>
          </Link>
        </Flex>

        {trips && trips.length > 0 ? (
          <Flex direction="column" gap="3">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                golferCount={golferCountByTrip.get(trip.id) || 0}
              />
            ))}
          </Flex>
        ) : (
          <EmptyState
            title="No trips yet"
            description="Create your first golf trip to get started"
            action={
              <Link to="/trips/new">
                <Button>
                  <Plus size={16} />
                  Create Trip
                </Button>
              </Link>
            }
          />
        )}
      </Flex>
    </Container>
  )
}
