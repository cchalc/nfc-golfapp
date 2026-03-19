import { createFileRoute } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Card,
  Text,
  Checkbox,
  Badge,
} from '@radix-ui/themes'
import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  tripCollection,
  golferCollection,
  tripGolferCollection,
} from '../../../db/collections'
import { GolferCard } from '../../../components/golfers/GolferCard'
import { EmptyState } from '../../../components/ui/EmptyState'

export const Route = createFileRoute('/trips/$tripId/golfers')({
  ssr: false,
  component: TripGolfersPage,
})

function TripGolfersPage() {
  const { tripId } = Route.useParams()

  const { data: trips } = useLiveQuery(
    (q) => q.from({ trip: tripCollection }).where(({ trip }) => eq(trip.id, tripId)),
    [tripId]
  )
  const trip = trips?.[0]

  const { data: allGolfers } = useLiveQuery(
    (q) =>
      q.from({ golfer: golferCollection }).orderBy(({ golfer }) => golfer.name, 'asc'),
    []
  )

  const { data: tripGolfers } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.tripId, tripId)),
    [tripId]
  )

  const tripGolferIds = new Set((tripGolfers || []).map((tg) => tg.golferId))

  function toggleGolfer(golferId: string) {
    const existing = tripGolfers?.find((tg) => tg.golferId === golferId)

    if (existing) {
      tripGolferCollection.delete(existing.id)
    } else {
      tripGolferCollection.insert({
        id: crypto.randomUUID(),
        tripId,
        golferId,
        status: 'accepted',
        invitedAt: new Date(),
        acceptedAt: new Date(),
      })
    }
  }

  if (!trip) {
    return (
      <Container size="2" py="6">
        <Text>Trip not found</Text>
      </Container>
    )
  }

  const addedGolfers = (allGolfers || []).filter((g) => tripGolferIds.has(g.id))
  const availableGolfers = (allGolfers || []).filter((g) => !tripGolferIds.has(g.id))

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="5">
        <Flex direction="column" gap="3">
          <Heading size="7">Trip Golfers</Heading>
          <Text color="gray">{trip.name}</Text>
        </Flex>

        {/* Added Golfers */}
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <Heading size="4">Playing</Heading>
            <Badge>{addedGolfers.length}</Badge>
          </Flex>

          {addedGolfers.length > 0 ? (
            <Flex direction="column" gap="2">
              {addedGolfers.map((golfer) => (
                <Card key={golfer.id}>
                  <Flex align="center" gap="3">
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => toggleGolfer(golfer.id)}
                    />
                    <Flex style={{ flex: 1 }}>
                      <GolferCard golfer={golfer} />
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
          ) : (
            <Card>
              <Text color="gray" size="2">
                No golfers added yet
              </Text>
            </Card>
          )}
        </Flex>

        {/* Available Golfers */}
        {availableGolfers.length > 0 && (
          <Flex direction="column" gap="3">
            <Heading size="4">Add Golfers</Heading>
            <Flex direction="column" gap="2">
              {availableGolfers.map((golfer) => (
                <Card key={golfer.id}>
                  <Flex align="center" gap="3">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => toggleGolfer(golfer.id)}
                    />
                    <Flex style={{ flex: 1 }}>
                      <GolferCard golfer={golfer} />
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Flex>
        )}

        {(!allGolfers || allGolfers.length === 0) && (
          <EmptyState
            title="No golfers in directory"
            description="Add golfers to your directory first"
          />
        )}
      </Flex>
    </Container>
  )
}
