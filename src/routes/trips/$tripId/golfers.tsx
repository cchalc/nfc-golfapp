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
  roundCollection,
  courseCollection,
  holeCollection,
  scoreCollection,
  roundSummaryCollection,
  type TripGolfer,
} from '../../../db/collections'
import { GolferCard } from '../../../components/golfers/GolferCard'
import { EmptyState } from '../../../components/ui/EmptyState'
import {
  getPlayingHandicap,
  getHandicapStrokes,
  calculateNetScore,
  calculateStablefordPoints,
  isBirdieOrBetter,
} from '../../../lib/scoring'

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

  // Fetch rounds for this trip (needed for score recalculation)
  const { data: rounds } = useLiveQuery(
    (q) =>
      q.from({ round: roundCollection }).where(({ round }) => eq(round.tripId, tripId)),
    [tripId]
  )

  // Fetch courses (needed for handicap calculation)
  const { data: courses } = useLiveQuery(
    (q) => q.from({ course: courseCollection }),
    []
  )
  const courseMap = new Map((courses || []).map((c) => [c.id, c]))

  // Fetch all holes
  const { data: holes } = useLiveQuery(
    (q) => q.from({ hole: holeCollection }),
    []
  )

  // Fetch all scores
  const { data: allScores } = useLiveQuery(
    (q) => q.from({ score: scoreCollection }),
    []
  )

  // Fetch round summaries
  const { data: roundSummaries } = useLiveQuery(
    (q) => q.from({ summary: roundSummaryCollection }),
    []
  )

  function toggleGolfer(golferId: string) {
    const existing = tripGolfers?.find((tg) => tg.golferId === golferId)

    if (existing) {
      tripGolferCollection.delete(existing.id)
    } else {
      // Capture the golfer's current handicap when adding them to the trip
      // This ensures the trip uses a locked-in handicap that won't change
      // if the golfer's main handicap is updated later
      const golfer = allGolfers?.find((g) => g.id === golferId)
      const capturedHandicap = golfer?.handicap ?? 0

      tripGolferCollection.insert({
        id: crypto.randomUUID(),
        tripId,
        golferId,
        status: 'accepted',
        invitedAt: new Date(),
        acceptedAt: new Date(),
        handicapOverride: capturedHandicap,
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

  function saveHandicapOverride(tripGolferId: string, golferId: string) {
    const value = parseFloat(handicapValue)
    if (isNaN(value) || value < 0 || value > 54) {
      setEditingHandicap(null)
      setHandicapValue('')
      return
    }

    // Update the trip golfer handicap
    tripGolferCollection.update(tripGolferId, (draft) => {
      draft.handicapOverride = value
    })

    // Recalculate all scores for this golfer in this trip
    recalculateGolferScores(golferId, value)

    setEditingHandicap(null)
    setHandicapValue('')
  }

  function recalculateGolferScores(golferId: string, newHandicap: number) {
    if (!rounds || !holes || !allScores) return

    // Group holes by courseId
    const holesByCourse = new Map<string, typeof holes>()
    for (const hole of holes) {
      const existing = holesByCourse.get(hole.courseId) || []
      existing.push(hole)
      holesByCourse.set(hole.courseId, existing)
    }

    // Process each round in this trip
    for (const round of rounds) {
      const course = courseMap.get(round.courseId)
      if (!course) continue

      const courseHoles = holesByCourse.get(course.id) || []
      const holeMap = new Map(courseHoles.map((h) => [h.id, h]))

      // Calculate playing handicap for this course
      const playingHandicap = getPlayingHandicap(
        newHandicap,
        course.slopeRating,
        course.courseRating,
        course.totalPar
      )

      // Get scores for this golfer in this round
      const golferScores = (allScores || []).filter(
        (s) => s.roundId === round.id && s.golferId === golferId
      )

      // Recalculate each score
      let totalGross = 0
      let totalNet = 0
      let totalStableford = 0
      let birdiesOrBetter = 0

      for (const score of golferScores) {
        const hole = holeMap.get(score.holeId)
        if (!hole) continue

        const handicapStrokes = getHandicapStrokes(hole.strokeIndex, playingHandicap)
        const netScore = calculateNetScore(score.grossScore, handicapStrokes)
        const stablefordPoints = calculateStablefordPoints(netScore, hole.par)

        // Update the score
        scoreCollection.update(score.id, (draft) => {
          draft.handicapStrokes = handicapStrokes
          draft.netScore = netScore
          draft.stablefordPoints = stablefordPoints
        })

        totalGross += score.grossScore
        totalNet += netScore
        totalStableford += stablefordPoints
        if (isBirdieOrBetter(netScore, hole.par)) {
          birdiesOrBetter++
        }
      }

      // Update round summary if there are scores
      if (golferScores.length > 0) {
        const existingSummary = (roundSummaries || []).find(
          (s) => s.roundId === round.id && s.golferId === golferId
        )

        if (existingSummary) {
          roundSummaryCollection.update(existingSummary.id, (draft) => {
            draft.totalGross = totalGross
            draft.totalNet = totalNet
            draft.totalStableford = totalStableford
            draft.birdiesOrBetter = birdiesOrBetter
          })
        }
      }
    }
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

                const isOverrideDifferent =
                  tripGolfer?.handicapOverride !== null &&
                  tripGolfer?.handicapOverride !== golfer.handicap

                return (
                  <Card key={golfer.id}>
                    <Flex align="center" gap="3">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => toggleGolfer(golfer.id)}
                      />
                      <Flex style={{ flex: 1 }} align="center" justify="between">
                        <GolferCard golfer={golfer} />
                        <Flex direction="column" align="end" gap="1">
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
                                onClick={() => saveHandicapOverride(tripGolfer!.id, golfer.id)}
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
                                content={`Trip handicap used for scoring. Current: ${golfer.handicap.toFixed(1)}`}
                              >
                                <Badge
                                  color="grass"
                                  variant="solid"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() =>
                                    startEditingHandicap(tripGolfer!, golfer.handicap)
                                  }
                                >
                                  HCP {effectiveHandicap?.toFixed(1)}
                                </Badge>
                              </Tooltip>
                              <Tooltip content="Edit trip handicap">
                                <IconButton
                                  size="1"
                                  variant="ghost"
                                  color="gray"
                                  onClick={() =>
                                    startEditingHandicap(tripGolfer!, golfer.handicap)
                                  }
                                >
                                  <Edit2 size={12} />
                                </IconButton>
                              </Tooltip>
                            </Flex>
                          )}
                          {isOverrideDifferent && (
                            <Text size="1" color="gray">
                              Current: {golfer.handicap.toFixed(1)}
                            </Text>
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
