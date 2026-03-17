import { createFileRoute, Link } from '@tanstack/react-router'
import { Container, Flex, Heading, Text, Button, Card, Grid } from '@radix-ui/themes'
import { Flag, Users } from 'lucide-react'
import { useLiveQuery, count } from '@tanstack/react-db'
import { tripCollection, golferCollection, roundCollection } from '../db/collections'

export const Route = createFileRoute('/')({
  ssr: false,
  component: HomePage,
})

function HomePage() {
  const { data: tripStats } = useLiveQuery(
    (q) =>
      q.from({ trip: tripCollection }).select(({ trip }) => ({
        total: count(trip.id),
      })),
    []
  )

  const { data: golferStats } = useLiveQuery(
    (q) =>
      q.from({ golfer: golferCollection }).select(({ golfer }) => ({
        total: count(golfer.id),
      })),
    []
  )

  const { data: roundStats } = useLiveQuery(
    (q) =>
      q.from({ round: roundCollection }).select(({ round }) => ({
        total: count(round.id),
      })),
    []
  )

  const tripCount = tripStats?.[0]?.total ?? 0
  const golferCount = golferStats?.[0]?.total ?? 0
  const roundCount = roundStats?.[0]?.total ?? 0

  return (
    <Container size="2" py="9">
      <Flex direction="column" gap="6">
        <Flex direction="column" gap="2" align="center">
          <Heading size="8">Golf Trip Planner</Heading>
          <Text size="3" color="gray">
            Plan trips, track scores, and compete with friends
          </Text>
        </Flex>

        <Grid columns="3" gap="3">
          <Card>
            <Flex direction="column" align="center" gap="1">
              <Text size="6" weight="bold">
                {tripCount}
              </Text>
              <Text size="2" color="gray">
                Trips
              </Text>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" align="center" gap="1">
              <Text size="6" weight="bold">
                {golferCount}
              </Text>
              <Text size="2" color="gray">
                Golfers
              </Text>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" align="center" gap="1">
              <Text size="6" weight="bold">
                {roundCount}
              </Text>
              <Text size="2" color="gray">
                Rounds
              </Text>
            </Flex>
          </Card>
        </Grid>

        <Grid columns="2" gap="3">
          <Link to="/trips">
            <Card asChild>
              <Flex direction="column" align="center" gap="2" py="4">
                <Flag size={32} />
                <Text weight="medium">View Trips</Text>
              </Flex>
            </Card>
          </Link>
          <Link to="/golfers">
            <Card asChild>
              <Flex direction="column" align="center" gap="2" py="4">
                <Users size={32} />
                <Text weight="medium">Golfers</Text>
              </Flex>
            </Card>
          </Link>
        </Grid>

        {tripCount === 0 && (
          <Flex direction="column" align="center" gap="3" py="4">
            <Text color="gray">Get started by creating your first trip</Text>
            <Link to="/trips/new">
              <Button size="3">Create Trip</Button>
            </Link>
          </Flex>
        )}
      </Flex>
    </Container>
  )
}
