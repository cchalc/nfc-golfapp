import { createFileRoute, Link } from '@tanstack/react-router'
import { Container, Flex, Heading, Text, Button, Card, Grid } from '@radix-ui/themes'
import { Flag, Users, Trophy } from 'lucide-react'
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
        <Flex direction="column" gap="4" align="center" className="animate-reveal-1">
          <Heading size="8">Golf Trip Planner</Heading>
          <Text size="3" color="gray">
            Plan trips, track scores, and compete with friends
          </Text>
        </Flex>

        <Grid columns={{ initial: '1', sm: '3' }} gap="4" className="animate-reveal-2">
          <Card className="card-gold-hover">
            <Flex direction="column" align="center" gap="2" py="3">
              <Heading size="6" style={{ color: 'var(--amber-9)' }}>
                {tripCount}
              </Heading>
              <Text size="2" color="gray">
                Trips
              </Text>
            </Flex>
          </Card>
          <Card className="card-gold-hover">
            <Flex direction="column" align="center" gap="2" py="3">
              <Heading size="6" style={{ color: 'var(--amber-9)' }}>
                {golferCount}
              </Heading>
              <Text size="2" color="gray">
                Golfers
              </Text>
            </Flex>
          </Card>
          <Card className="card-gold-hover">
            <Flex direction="column" align="center" gap="2" py="3">
              <Heading size="6" style={{ color: 'var(--amber-9)' }}>
                {roundCount}
              </Heading>
              <Text size="2" color="gray">
                Rounds
              </Text>
            </Flex>
          </Card>
        </Grid>

        <Grid columns={{ initial: '1', sm: '2' }} gap="3" className="animate-reveal-3">
          <Link to="/trips" style={{ textDecoration: 'none' }}>
            <Card asChild>
              <Flex direction="column" align="center" gap="2" py="4">
                <Flag size={32} style={{ color: 'var(--grass-9)' }} />
                <Text weight="medium">View Trips</Text>
              </Flex>
            </Card>
          </Link>
          <Link to="/golfers" style={{ textDecoration: 'none' }}>
            <Card asChild>
              <Flex direction="column" align="center" gap="2" py="4">
                <Users size={32} style={{ color: 'var(--grass-9)' }} />
                <Text weight="medium">Golfers</Text>
              </Flex>
            </Card>
          </Link>
        </Grid>

        {tripCount === 0 && (
          <Flex direction="column" align="center" gap="4" py="4" className="animate-reveal-4">
            <Flex align="center" gap="2">
              <Trophy size={20} style={{ color: 'var(--amber-9)' }} />
              <Text color="gray">Get started by creating your first trip</Text>
            </Flex>
            <Link to="/trips/new">
              <Button size="3" color="grass">
                Create Trip
              </Button>
            </Link>
          </Flex>
        )}
      </Flex>
    </Container>
  )
}
