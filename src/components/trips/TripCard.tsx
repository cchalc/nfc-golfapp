import { Card, Flex, Text, Heading, Badge } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import { Calendar, MapPin, Users } from 'lucide-react'
import type { Trip } from '../../db/collections'

interface TripCardProps {
  trip: Trip
  golferCount?: number
}

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  }
  const startStr = start.toLocaleDateString('en-US', opts)
  const endStr = end.toLocaleDateString('en-US', {
    ...opts,
    year: 'numeric',
  })
  return `${startStr} - ${endStr}`
}

export function TripCard({ trip, golferCount = 0 }: TripCardProps) {
  const now = new Date()
  const isUpcoming = trip.startDate > now
  const isActive = trip.startDate <= now && trip.endDate >= now
  const isPast = trip.endDate < now

  return (
    <Link to="/trips/$tripId" params={{ tripId: trip.id }} style={{ textDecoration: 'none' }}>
      <Card className="card-gold-hover">
        <Flex direction="column" gap="5">
          <Flex justify="between" align="start">
            <Heading size="4">{trip.name}</Heading>
            {isUpcoming && <Badge color="grass">Upcoming</Badge>}
            {isActive && <Badge color="amber">Active</Badge>}
            {isPast && <Badge variant="soft" color="gray">Completed</Badge>}
          </Flex>

          {trip.description && (
            <Text size="2" color="gray">
              {trip.description}
            </Text>
          )}

          <Flex gap="4">
            <Flex align="center" gap="1">
              <Calendar size={14} style={{ color: 'var(--grass-9)' }} />
              <Text size="2" color="gray">
                {formatDateRange(trip.startDate, trip.endDate)}
              </Text>
            </Flex>

            {trip.location && (
              <Flex align="center" gap="1">
                <MapPin size={14} style={{ color: 'var(--grass-9)' }} />
                <Text size="2" color="gray">
                  {trip.location}
                </Text>
              </Flex>
            )}

            <Flex align="center" gap="1">
              <Users size={14} style={{ color: 'var(--grass-9)' }} />
              <Text size="2" color="gray">
                {golferCount} golfers
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Card>
    </Link>
  )
}
