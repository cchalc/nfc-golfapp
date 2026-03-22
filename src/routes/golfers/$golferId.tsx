import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Avatar,
  Badge,
  Button,
  Dialog,
  Separator,
  Grid,
} from '@radix-ui/themes'
import { ArrowLeft, Mail, Phone, Trophy, Flag, Calendar, Edit, ChevronRight } from 'lucide-react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { useDialogState } from '../../hooks/useDialogState'
import {
  golferCollection,
  tripGolferCollection,
  tripCollection,
  roundSummaryCollection,
  roundCollection,
  courseCollection,
} from '../../db/collections'
import { GolferForm } from '../../components/golfers/GolferForm'

export const Route = createFileRoute('/golfers/$golferId')({
  ssr: false,
  component: GolferDetailPage,
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function GolferDetailPage() {
  const { golferId } = Route.useParams()
  const [editDialogOpen, setEditDialogOpen] = useDialogState(`edit-golfer-${golferId}`)

  const { data: golfers } = useLiveQuery(
    (q) =>
      q.from({ golfer: golferCollection }).where(({ golfer }) => eq(golfer.id, golferId)),
    [golferId]
  )

  const golfer = golfers?.[0]

  // Get trips this golfer has participated in
  const { data: tripGolfers } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.golferId, golferId))
        .join({ trip: tripCollection }, ({ tg, trip }) => eq(tg.tripId, trip!.id))
        .select(({ trip, tg }) => ({
          tripId: trip!.id,
          tripName: trip!.name,
          location: trip!.location,
          startDate: trip!.startDate,
          endDate: trip!.endDate,
          status: tg.status,
        })),
    [golferId]
  )

  // Get round summaries for this golfer with trip and course info
  const { data: roundSummaries } = useLiveQuery(
    (q) =>
      q
        .from({ rs: roundSummaryCollection })
        .where(({ rs }) => eq(rs.golferId, golferId))
        .join({ round: roundCollection }, ({ rs, round }) => eq(rs.roundId, round!.id))
        .join({ trip: tripCollection }, ({ round, trip }) => eq(round!.tripId, trip!.id))
        .join({ course: courseCollection }, ({ round, course }) => eq(round!.courseId, course!.id))
        .select(({ rs, round, trip, course }) => ({
          roundId: rs.roundId,
          tripId: round!.tripId,
          tripName: trip!.name,
          courseName: course!.name,
          totalGross: rs.totalGross,
          totalNet: rs.totalNet,
          totalStableford: rs.totalStableford,
          birdiesOrBetter: rs.birdiesOrBetter,
          roundDate: round!.roundDate,
          roundNumber: round!.roundNumber,
        }))
        .orderBy(({ round }) => round!.roundDate, 'desc'),
    [golferId]
  )

  if (!golfer) {
    return (
      <Container size="2" py="6">
        <Flex direction="column" gap="4" align="center">
          <Text color="gray">Golfer not found</Text>
          <Link to="/golfers">
            <Button variant="soft">
              <ArrowLeft size={16} />
              Back to Golfers
            </Button>
          </Link>
        </Flex>
      </Container>
    )
  }

  const trips = tripGolfers || []
  const rounds = roundSummaries || []

  // Calculate stats
  const totalRounds = rounds.length
  const avgGross =
    totalRounds > 0
      ? Math.round(rounds.reduce((sum, r) => sum + r.totalGross, 0) / totalRounds)
      : null
  const avgStableford =
    totalRounds > 0
      ? Math.round(rounds.reduce((sum, r) => sum + r.totalStableford, 0) / totalRounds)
      : null
  const totalBirdies = rounds.reduce((sum, r) => sum + r.birdiesOrBetter, 0)

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="6">
        {/* Back button */}
        <Link to="/golfers">
          <Button variant="ghost" size="1">
            <ArrowLeft size={16} />
            Back to Golfers
          </Button>
        </Link>

        {/* Profile header */}
        <Card>
          <Flex gap="4" align="start">
            <Avatar
              size="6"
              src={golfer.profileImageUrl || undefined}
              fallback={getInitials(golfer.name)}
              radius="full"
              color="amber"
            />
            <Flex direction="column" gap="3" style={{ flex: 1 }}>
              <Flex justify="between" align="start">
                <Flex direction="column" gap="3">
                  <Heading size="6">{golfer.name}</Heading>
                  <Badge size="2" color="grass" variant="soft">
                    HCP {golfer.handicap.toFixed(1)}
                  </Badge>
                </Flex>
                <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <Dialog.Trigger>
                    <Button variant="soft" size="1">
                      <Edit size={14} />
                      Edit
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Content maxWidth="400px">
                    <Dialog.Title>Edit Golfer</Dialog.Title>
                    <Flex direction="column" gap="4" pt="4">
                      <GolferForm
                        golferId={golfer.id}
                        initialData={{
                          name: golfer.name,
                          email: golfer.email,
                          phone: golfer.phone,
                          handicap: golfer.handicap,
                        }}
                        onSuccess={() => setEditDialogOpen(false)}
                      />
                    </Flex>
                  </Dialog.Content>
                </Dialog.Root>
              </Flex>

              {/* Contact info */}
              <Flex gap="4" wrap="wrap">
                {golfer.email && (
                  <Flex align="center" gap="1">
                    <Mail size={14} style={{ color: 'var(--gray-9)' }} />
                    <Text size="2" color="gray">
                      {golfer.email}
                    </Text>
                  </Flex>
                )}
                {golfer.phone && (
                  <Flex align="center" gap="1">
                    <Phone size={14} style={{ color: 'var(--gray-9)' }} />
                    <Text size="2" color="gray">
                      {golfer.phone}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {/* Stats summary */}
        {totalRounds > 0 && (
          <Grid columns={{ initial: '2', md: '4' }} gap="3">
            <Card>
              <Flex direction="column" align="center" gap="2">
                <Heading size="5" style={{ color: 'var(--amber-9)' }}>
                  {totalRounds}
                </Heading>
                <Text size="1" color="gray">
                  Rounds
                </Text>
              </Flex>
            </Card>
            <Card>
              <Flex direction="column" align="center" gap="2">
                <Heading size="5" style={{ color: 'var(--amber-9)' }}>
                  {avgGross}
                </Heading>
                <Text size="1" color="gray">
                  Avg Gross
                </Text>
              </Flex>
            </Card>
            <Card>
              <Flex direction="column" align="center" gap="2">
                <Heading size="5" style={{ color: 'var(--amber-9)' }}>
                  {avgStableford}
                </Heading>
                <Text size="1" color="gray">
                  Avg Points
                </Text>
              </Flex>
            </Card>
            <Card>
              <Flex direction="column" align="center" gap="2">
                <Heading size="5" style={{ color: 'var(--amber-9)' }}>
                  {totalBirdies}
                </Heading>
                <Text size="1" color="gray">
                  Birdies+
                </Text>
              </Flex>
            </Card>
          </Grid>
        )}

        <Separator size="4" />

        {/* Trips section */}
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <Flag size={18} style={{ color: 'var(--grass-9)' }} />
            <Heading size="4">Trips</Heading>
          </Flex>

          {trips.length > 0 ? (
            <Flex direction="column" gap="2">
              {trips.map((trip) => (
                <Link
                  key={trip.tripId}
                  to="/trips/$tripId"
                  params={{ tripId: trip.tripId }}
                  style={{ textDecoration: 'none' }}
                >
                  <Card>
                    <Flex justify="between" align="center">
                      <Flex direction="column" gap="3">
                        <Text weight="medium">{trip.tripName}</Text>
                        <Flex align="center" gap="2">
                          <Calendar size={12} />
                          <Text size="1" color="gray">
                            {trip.startDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Text>
                          {trip.location && (
                            <Text size="1" color="gray">
                              • {trip.location}
                            </Text>
                          )}
                        </Flex>
                      </Flex>
                      <Badge
                        variant="soft"
                        color={
                          trip.status === 'accepted'
                            ? 'grass'
                            : trip.status === 'declined'
                              ? 'red'
                              : 'amber'
                        }
                      >
                        {trip.status}
                      </Badge>
                    </Flex>
                  </Card>
                </Link>
              ))}
            </Flex>
          ) : (
            <Card>
              <Flex align="center" justify="center" py="4">
                <Text size="2" color="gray">
                  No trips yet
                </Text>
              </Flex>
            </Card>
          )}
        </Flex>

        {/* Recent rounds section */}
        {rounds.length > 0 && (
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <Trophy size={18} style={{ color: 'var(--amber-9)' }} />
              <Heading size="4">Recent Rounds</Heading>
            </Flex>

            <Flex direction="column" gap="2">
              {rounds.slice(0, 5).map((round) => (
                <Link
                  key={round.roundId}
                  to="/trips/$tripId/rounds/$roundId/scorecard"
                  params={{ tripId: round.tripId, roundId: round.roundId }}
                  search={{ golferId }}
                >
                  <Card asChild>
                    <Flex justify="between" align="center" gap="3">
                      <Flex direction="column" gap="3">
                        <Flex align="center" gap="2">
                          <Badge size="1">R{round.roundNumber}</Badge>
                          <Text weight="medium">{round.courseName}</Text>
                        </Flex>
                        <Flex align="center" gap="2" wrap="wrap">
                          <Flex align="center" gap="1">
                            <Flag size={12} style={{ color: 'var(--grass-9)' }} />
                            <Text size="1" color="gray">
                              {round.tripName}
                            </Text>
                          </Flex>
                          <Text size="1" color="gray">•</Text>
                          <Flex align="center" gap="1">
                            <Calendar size={12} style={{ color: 'var(--gray-9)' }} />
                            <Text size="1" color="gray">
                              {round.roundDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </Text>
                          </Flex>
                        </Flex>
                        <Flex gap="5" wrap="wrap">
                          <Flex direction="column" gap="1">
                            <Text size="1" color="gray">Gross</Text>
                            <Text size="3" weight="medium">{round.totalGross}</Text>
                          </Flex>
                          <Flex direction="column" gap="1">
                            <Text size="1" color="gray">Net</Text>
                            <Text size="3" weight="medium">{round.totalNet}</Text>
                          </Flex>
                          <Flex direction="column" gap="1">
                            <Text size="1" color="gray">Pts</Text>
                            <Text size="3" weight="medium" style={{ color: 'var(--amber-9)' }}>{round.totalStableford}</Text>
                          </Flex>
                          {round.birdiesOrBetter > 0 && (
                            <Flex direction="column" gap="1">
                              <Text size="1" color="gray">Birdies</Text>
                              <Text size="3" weight="medium" color="grass">{round.birdiesOrBetter}</Text>
                            </Flex>
                          )}
                        </Flex>
                      </Flex>
                      <ChevronRight size={16} style={{ color: 'var(--gray-9)', flexShrink: 0 }} />
                    </Flex>
                  </Card>
                </Link>
              ))}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Container>
  )
}
