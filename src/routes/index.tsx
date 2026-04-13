import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Container, Flex, Heading, Text, Button, Card, Grid } from '@radix-ui/themes'
import { Flag, Users, MapPin, Trophy, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTrips } from '../hooks/queries'

export const Route = createFileRoute('/')({
  ssr: false,
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const { data: trips } = useTrips()
  const tripCount = trips?.length ?? 0

  return (
    <Container size="2" py="9">
      <Flex direction="column" gap="6">
        <Flex direction="column" gap="4" align="center" className="animate-reveal-1">
          <Heading size="8" style={{ color: 'var(--grass-9)' }}>Golf Trip</Heading>
          <Text size="3" color="gray">
            Plan trips, track scores, and compete with friends
          </Text>
        </Flex>

        <Grid columns={{ initial: '1', sm: '3' }} gap="3" className="animate-reveal-2">
          <Link to="/trips" style={{ textDecoration: 'none' }}>
            <Card asChild>
              <Flex direction="column" align="center" gap="2" py="4">
                <Flag size={32} style={{ color: 'var(--grass-9)' }} />
                <Text weight="medium">Trips</Text>
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
          <Link to="/courses" style={{ textDecoration: 'none' }}>
            <Card asChild>
              <Flex direction="column" align="center" gap="2" py="4">
                <MapPin size={32} style={{ color: 'var(--grass-9)' }} />
                <Text weight="medium">Courses</Text>
              </Flex>
            </Card>
          </Link>
        </Grid>

        {!isAuthenticated && (
          <Flex direction="column" align="center" gap="3" py="4" className="animate-reveal-4">
            <Text color="gray" align="center">
              Sign in to create and manage trips
            </Text>
            <Button
              size="3"
              color="grass"
              onClick={() => navigate({ to: '/login' })}
            >
              <LogIn size={16} />
              Sign In
            </Button>
          </Flex>
        )}

        {isAuthenticated && tripCount === 0 && (
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
