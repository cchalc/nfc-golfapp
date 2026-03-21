import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Card,
  Text,
  Checkbox,
  Badge,
  TextField,
  IconButton,
  Tooltip,
} from '@radix-ui/themes'
import { ChevronLeft, Edit2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  tripCollection,
  golferCollection,
  tripGolferCollection,
  type TripGolfer,
} from '../../../db/collections'
import { GolferCard } from '../../../components/golfers/GolferCard'
import { EmptyState } from '../../../components/ui/EmptyState'

export const Route = createFileRoute('/trips/$tripId/golfers')({
  ssr: false,
  component: TripGolfersPage,
})

function TripGolfersPage() {
  const { tripId } = Route.useParams()
  const [editingHandicap, setEditingHandicap] = useState<string | null>(null)
  const [handicapValue, setHandicapValue] = useState('')

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

  const tripGolferMap = new Map((tripGolfers || []).map((tg) => [tg.golferId, tg]))
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
        handicapOverride: null,
      })
    }
  }

  function startEditingHandicap(tripGolfer: TripGolfer, golferHandicap: number) {
    setEditingHandicap(tripGolfer.id)
    setHandicapValue(
      tripGolfer.handicapOverride !== null
        ? tripGolfer.handicapOverride.toString()
        : golferHandicap.toString()
    )
  }

  function saveHandicapOverride(tripGolferId: string) {
    const value = parseFloat(handicapValue)
    if (!isNaN(value) && value >= 0 && value <= 54) {
      tripGolferCollection.update(tripGolferId, {
        handicapOverride: value,
      })
    }
    setEditingHandicap(null)
    setHandicapValue('')
  }

  function clearHandicapOverride(tripGolferId: string) {
    tripGolferCollection.update(tripGolferId, {
      handicapOverride: null,
    })
    setEditingHandicap(null)
    setHandicapValue('')
  }

  function cancelEditingHandicap() {
    setEditingHandicap(null)
    setHandicapValue('')
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
        {/* Back navigation */}
        <Link
          to="/trips/$tripId"
          params={{ tripId }}
          style={{ textDecoration: 'none' }}
        >
          <Flex align="center" gap="1" style={{ color: 'var(--accent-11)' }}>
            <ChevronLeft size={20} />
            <Text size="2">Back to Trip</Text>
          </Flex>
        </Link>

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
              {addedGolfers.map((golfer) => {
                const tripGolfer = tripGolferMap.get(golfer.id)
                const effectiveHandicap =
                  tripGolfer?.handicapOverride !== null
                    ? tripGolfer?.handicapOverride
                    : golfer.handicap
                const hasOverride = tripGolfer?.handicapOverride !== null

                return (
                  <Card key={golfer.id}>
                    <Flex align="center" gap="3">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => toggleGolfer(golfer.id)}
                      />
                      <Flex style={{ flex: 1 }} align="center" justify="between">
                        <GolferCard golfer={golfer} />
                        <Flex align="center" gap="2">
                          {editingHandicap === tripGolfer?.id ? (
                            <Flex align="center" gap="1">
                              <TextField.Root
                                size="1"
                                type="number"
                                value={handicapValue}
                                onChange={(e) => setHandicapValue(e.target.value)}
                                style={{ width: 60 }}
                                min={0}
                                max={54}
                                step={0.1}
                              />
                              <IconButton
                                size="1"
                                variant="soft"
                                color="grass"
                                onClick={() => saveHandicapOverride(tripGolfer!.id)}
                              >
                                <Check size={14} />
                              </IconButton>
                              <IconButton
                                size="1"
                                variant="soft"
                                color="gray"
                                onClick={cancelEditingHandicap}
                              >
                                <X size={14} />
                              </IconButton>
                            </Flex>
                          ) : (
                            <Flex align="center" gap="1">
                              <Tooltip
                                content={
                                  hasOverride
                                    ? `Trip handicap (base: ${golfer.handicap})`
                                    : 'Click to set trip-specific handicap'
                                }
                              >
                                <Badge
                                  color={hasOverride ? 'amber' : 'gray'}
                                  variant={hasOverride ? 'solid' : 'soft'}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() =>
                                    startEditingHandicap(tripGolfer!, golfer.handicap)
                                  }
                                >
                                  {effectiveHandicap}
                                </Badge>
                              </Tooltip>
                              {hasOverride && (
                                <Tooltip content="Reset to golfer's default handicap">
                                  <IconButton
                                    size="1"
                                    variant="ghost"
                                    color="gray"
                                    onClick={() => clearHandicapOverride(tripGolfer!.id)}
                                  >
                                    <X size={12} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Flex>
                          )}
                        </Flex>
                      </Flex>
                    </Flex>
                  </Card>
                )
              })}
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
