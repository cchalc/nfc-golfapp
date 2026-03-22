import { createFileRoute } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Dialog,
  AlertDialog,
} from '@radix-ui/themes'
import { Plus, Trophy } from 'lucide-react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { useEffect, useRef } from 'react'
import { useDialogState } from '../../../hooks/useDialogState'
import {
  tripCollection,
  challengeCollection,
  challengeResultCollection,
  golferCollection,
  tripGolferCollection,
  roundCollection,
  holeCollection,
  courseCollection,
  roundSummaryCollection,
  type Challenge,
  type ChallengeResult,
  type Hole,
} from '../../../db/collections'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ChallengeCard } from '../../../components/challenges/ChallengeCard'
import { ChallengeForm } from '../../../components/challenges/ChallengeForm'
import { ChallengeResultEntry } from '../../../components/challenges/ChallengeResultEntry'
import { isAutoCalculatedChallenge } from '../../../lib/challenges'

export const Route = createFileRoute('/trips/$tripId/challenges')({
  ssr: false,
  component: ChallengesPage,
})

function ChallengesPage() {
  const { tripId } = Route.useParams()
  const [addChallengeDialogOpen, setAddChallengeDialogOpen] = useDialogState(`add-challenge-${tripId}`)

  // Fetch trip
  const { data: trips } = useLiveQuery(
    (q) => q.from({ trip: tripCollection }).where(({ trip }) => eq(trip.id, tripId)),
    [tripId]
  )
  const trip = trips?.[0]

  // Fetch all challenges for this trip
  const { data: challenges } = useLiveQuery(
    (q) =>
      q
        .from({ challenge: challengeCollection })
        .where(({ challenge }) => eq(challenge.tripId, tripId)),
    [tripId]
  )

  // Fetch all challenge results
  const { data: allResults } = useLiveQuery(
    (q) => q.from({ result: challengeResultCollection }),
    []
  )

  // Fetch golfers for result entry
  const { data: golfers } = useLiveQuery(
    (q) => q.from({ golfer: golferCollection }),
    []
  )
  const golferMap = new Map((golfers || []).map((g) => [g.id, g]))

  // Fetch trip golfers (accepted only)
  const { data: tripGolfers } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.tripId, tripId))
        .where(({ tg }) => eq(tg.status, 'accepted')),
    [tripId]
  )
  const tripGolferIds = new Set((tripGolfers || []).map((tg) => tg.golferId))
  const tripGolferList = (golfers || []).filter((g) => tripGolferIds.has(g.id))

  // Fetch rounds for context
  const { data: rounds } = useLiveQuery(
    (q) =>
      q
        .from({ round: roundCollection })
        .where(({ round }) => eq(round.tripId, tripId)),
    [tripId]
  )
  const roundMap = new Map((rounds || []).map((r) => [r.id, r]))

  // Fetch holes for context
  const { data: holes } = useLiveQuery((q) => q.from({ hole: holeCollection }), [])
  const holeMap = new Map((holes || []).map((h) => [h.id, h]))

  // Fetch courses for display
  const { data: courses } = useLiveQuery((q) => q.from({ course: courseCollection }), [])
  const courseMap = new Map((courses || []).map((c) => [c.id, c]))

  // Group holes by courseId for the inline selector
  const holesByCourseId = new Map<string, Hole[]>()
  for (const h of holes || []) {
    const existing = holesByCourseId.get(h.courseId) || []
    existing.push(h)
    holesByCourseId.set(h.courseId, existing)
  }
  // Sort holes by holeNumber within each course
  for (const [courseId, courseHoles] of holesByCourseId) {
    holesByCourseId.set(
      courseId,
      courseHoles.sort((a, b) => a.holeNumber - b.holeNumber)
    )
  }

  // Fetch round summaries for auto-calculated challenges
  const { data: roundSummaries } = useLiveQuery(
    (q) => q.from({ summary: roundSummaryCollection }),
    []
  )

  // Group results by challengeId
  const resultsByChallengeId = new Map<string, ChallengeResult[]>()
  for (const result of allResults || []) {
    const existing = resultsByChallengeId.get(result.challengeId) || []
    existing.push(result)
    resultsByChallengeId.set(result.challengeId, existing)
  }

  // Find winner for each challenge
  function getWinnerInfo(challenge: Challenge) {
    // For auto-calculated challenges, compute from round summaries
    if (isAutoCalculatedChallenge(challenge.challengeType)) {
      return computeAutoWinner(challenge)
    }

    // For manual challenges, look at results
    const results = resultsByChallengeId.get(challenge.id) || []
    const winnerResult = results.find((r) => r.isWinner)
    if (!winnerResult) return { winner: null, winnerValue: undefined }

    const winner = golferMap.get(winnerResult.golferId)
    return { winner: winner || null, winnerValue: winnerResult.resultValue }
  }

  function computeAutoWinner(challenge: Challenge) {
    // Filter summaries to trip golfers and optionally to specific round
    let relevantSummaries = (roundSummaries || []).filter((s) =>
      tripGolferIds.has(s.golferId)
    )

    if (challenge.roundId) {
      relevantSummaries = relevantSummaries.filter(
        (s) => s.roundId === challenge.roundId
      )
    } else {
      // Trip-wide: filter to rounds in this trip
      const tripRoundIds = new Set((rounds || []).map((r) => r.id))
      relevantSummaries = relevantSummaries.filter((s) =>
        tripRoundIds.has(s.roundId)
      )
    }

    if (relevantSummaries.length === 0) {
      return { winner: null, winnerValue: undefined }
    }

    // Aggregate by golfer
    const aggregates = new Map<
      string,
      { totalBirdies: number; totalStableford: number; bestNet: number }
    >()

    for (const s of relevantSummaries) {
      const existing = aggregates.get(s.golferId) || {
        totalBirdies: 0,
        totalStableford: 0,
        bestNet: Infinity,
      }
      existing.totalBirdies += s.birdiesOrBetter
      existing.totalStableford += s.totalStableford
      existing.bestNet = Math.min(existing.bestNet, s.totalNet)
      aggregates.set(s.golferId, existing)
    }

    let winnerId: string | null = null
    let winnerValue = ''

    if (challenge.challengeType === 'most_birdies') {
      let maxBirdies = -1
      for (const [golferId, agg] of aggregates) {
        if (agg.totalBirdies > maxBirdies) {
          maxBirdies = agg.totalBirdies
          winnerId = golferId
          winnerValue = `${agg.totalBirdies} birdies`
        }
      }
    } else if (challenge.challengeType === 'best_net') {
      let bestNet = Infinity
      for (const [golferId, agg] of aggregates) {
        if (agg.bestNet < bestNet) {
          bestNet = agg.bestNet
          winnerId = golferId
          winnerValue = `${agg.bestNet}`
        }
      }
    } else if (challenge.challengeType === 'best_stableford') {
      let maxPts = -1
      for (const [golferId, agg] of aggregates) {
        if (agg.totalStableford > maxPts) {
          maxPts = agg.totalStableford
          winnerId = golferId
          winnerValue = `${agg.totalStableford} pts`
        }
      }
    }

    const winner = winnerId ? golferMap.get(winnerId) : null
    return { winner: winner || null, winnerValue }
  }

  function handleDeleteChallenge(challengeId: string) {
    // Delete results first
    const results = resultsByChallengeId.get(challengeId) || []
    for (const r of results) {
      challengeResultCollection.delete(r.id)
    }
    // Delete challenge
    challengeCollection.delete(challengeId)
  }

  // Auto-create default challenges (KP and LD) for each round if none exist
  const hasCreatedDefaults = useRef(false)
  useEffect(() => {
    // Only run once per trip when data is loaded
    if (hasCreatedDefaults.current) return
    if (!rounds || rounds.length === 0) return
    if (challenges === undefined) return // Still loading

    // If challenges already exist, don't auto-create
    if (challenges && challenges.length > 0) {
      hasCreatedDefaults.current = true
      return
    }

    hasCreatedDefaults.current = true

    // Create one KP and one LD for each round
    for (const round of rounds) {
      // Closest to Pin
      challengeCollection.insert({
        id: crypto.randomUUID(),
        tripId,
        name: '',
        challengeType: 'closest_to_pin',
        scope: 'hole',
        roundId: round.id,
        holeId: null,
        description: '',
        prizeDescription: '',
      })

      // Longest Drive
      challengeCollection.insert({
        id: crypto.randomUUID(),
        tripId,
        name: '',
        challengeType: 'longest_drive',
        scope: 'hole',
        roundId: round.id,
        holeId: null,
        description: '',
        prizeDescription: '',
      })
    }
  }, [rounds, challenges, tripId])

  if (!trip) {
    return (
      <Container size="2" py="6">
        <Text>Trip not found</Text>
      </Container>
    )
  }

  // Separate active (no winner yet) and completed challenges
  const activeChallenges: Challenge[] = []
  const completedChallenges: Challenge[] = []

  for (const challenge of challenges || []) {
    const { winner } = getWinnerInfo(challenge)
    if (winner) {
      completedChallenges.push(challenge)
    } else {
      activeChallenges.push(challenge)
    }
  }

  const hasChallenges = (challenges || []).length > 0

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="5">
        <Flex justify="between" align="center">
          <Flex direction="column" gap="3">
            <Heading size="7">Challenges</Heading>
            <Text color="gray">{trip.name}</Text>
          </Flex>

          <Dialog.Root open={addChallengeDialogOpen} onOpenChange={setAddChallengeDialogOpen}>
            <Dialog.Trigger>
              <Button data-testid="add-challenge-btn">
                <Plus size={16} />
                Add Challenge
              </Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="400px">
              <Dialog.Title>Create Challenge</Dialog.Title>
              <Flex direction="column" gap="4" pt="4">
                <ChallengeForm
                  tripId={tripId}
                  onSuccess={() => setAddChallengeDialogOpen(false)}
                />
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        {hasChallenges ? (
          <Flex direction="column" gap="6">
            {/* Active Challenges */}
            {activeChallenges.length > 0 && (
              <Flex direction="column" gap="3" data-testid="challenges-active">
                <Heading size="4">Active</Heading>
                <Flex direction="column" gap="3">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCardWithDialogs
                      key={challenge.id}
                      tripId={tripId}
                      challenge={challenge}
                      roundMap={roundMap}
                      holeMap={holeMap}
                      courseMap={courseMap}
                      holesByCourseId={holesByCourseId}
                      golferMap={golferMap}
                      tripGolferList={tripGolferList}
                      results={resultsByChallengeId.get(challenge.id) || []}
                      onDelete={() => handleDeleteChallenge(challenge.id)}
                    />
                  ))}
                </Flex>
              </Flex>
            )}

            {/* Completed Challenges */}
            {completedChallenges.length > 0 && (
              <Flex direction="column" gap="3" data-testid="challenges-completed">
                <Flex align="center" gap="2">
                  <Trophy size={18} style={{ color: 'var(--amber-9)' }} />
                  <Heading size="4">Completed</Heading>
                </Flex>
                <Flex direction="column" gap="3">
                  {completedChallenges.map((challenge) => (
                    <ChallengeCardWithDialogs
                      key={challenge.id}
                      tripId={tripId}
                      challenge={challenge}
                      roundMap={roundMap}
                      holeMap={holeMap}
                      courseMap={courseMap}
                      holesByCourseId={holesByCourseId}
                      golferMap={golferMap}
                      tripGolferList={tripGolferList}
                      results={resultsByChallengeId.get(challenge.id) || []}
                      onDelete={() => handleDeleteChallenge(challenge.id)}
                    />
                  ))}
                </Flex>
              </Flex>
            )}
          </Flex>
        ) : (
          <EmptyState
            title="No challenges yet"
            description="Create challenges like Closest to Pin or Longest Drive"
            action={
              <Dialog.Root open={addChallengeDialogOpen} onOpenChange={setAddChallengeDialogOpen}>
                <Dialog.Trigger>
                  <Button>
                    <Plus size={16} />
                    Create Challenge
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content maxWidth="400px">
                  <Dialog.Title>Create Challenge</Dialog.Title>
                  <Flex direction="column" gap="4" pt="4">
                    <ChallengeForm
                      tripId={tripId}
                      onSuccess={() => setAddChallengeDialogOpen(false)}
                    />
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>
            }
          />
        )}
      </Flex>
    </Container>
  )
}

// Separate component to handle per-challenge dialogs
interface ChallengeCardWithDialogsProps {
  tripId: string
  challenge: Challenge
  roundMap: Map<string, ReturnType<typeof roundCollection.get> & {}>
  holeMap: Map<string, ReturnType<typeof holeCollection.get> & {}>
  courseMap: Map<string, ReturnType<typeof courseCollection.get> & {}>
  holesByCourseId: Map<string, Hole[]>
  golferMap: Map<string, ReturnType<typeof golferCollection.get> & {}>
  tripGolferList: Array<ReturnType<typeof golferCollection.get> & {}>
  results: ChallengeResult[]
  onDelete: () => void
}

function ChallengeCardWithDialogs({
  tripId,
  challenge,
  roundMap,
  holeMap,
  courseMap,
  holesByCourseId,
  golferMap,
  tripGolferList,
  results,
  onDelete,
}: ChallengeCardWithDialogsProps) {
  const [resultDialogOpen, setResultDialogOpen] = useDialogState(`results-${challenge.id}`)
  const [editDialogOpen, setEditDialogOpen] = useDialogState(`edit-${challenge.id}`)
  const [deleteDialogOpen, setDeleteDialogOpen] = useDialogState(`delete-${challenge.id}`)
  const round = challenge.roundId ? roundMap.get(challenge.roundId) : null
  const hole = challenge.holeId ? holeMap.get(challenge.holeId) : null
  const course = round?.courseId ? courseMap.get(round.courseId) : null
  const holesForRound = round?.courseId ? holesByCourseId.get(round.courseId) : undefined

  // Find winner from results
  const winnerResult = results.find((r) => r.isWinner)
  const winner = winnerResult ? golferMap.get(winnerResult.golferId) : null

  const handleConfirmDelete = () => {
    onDelete()
    setDeleteDialogOpen(false)
  }

  // Get challenge title for dialog (use type label if no name)
  const challengeTitle = challenge.name || (
    challenge.challengeType === 'closest_to_pin' ? 'Closest to Pin' :
    challenge.challengeType === 'longest_drive' ? 'Longest Drive' :
    'Challenge'
  )

  return (
    <>
      <ChallengeCard
        challenge={challenge}
        winner={winner}
        winnerValue={winnerResult?.resultValue}
        round={round}
        hole={hole}
        course={course}
        holes={holesForRound}
        onCardClick={() => setResultDialogOpen(true)}
        onEdit={() => setEditDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      {/* Results dialog for manual challenges - opened by clicking card */}
      {!isAutoCalculatedChallenge(challenge.challengeType) && (
        <Dialog.Root open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
          <Dialog.Content maxWidth="450px">
            <Dialog.Title>{winner ? 'Edit' : 'Enter'} Results: {challengeTitle}</Dialog.Title>
            <Flex direction="column" gap="4" pt="4">
              <ChallengeResultEntry
                challenge={challenge}
                golfers={tripGolferList}
                existingResults={results}
                onSuccess={() => setResultDialogOpen(false)}
              />
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      )}

      {/* Edit Challenge Dialog */}
      <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <Dialog.Content maxWidth="400px">
          <Dialog.Title>Edit Challenge</Dialog.Title>
          <Flex direction="column" gap="4" pt="4">
            <ChallengeForm
              tripId={tripId}
              challengeId={challenge.id}
              initialData={challenge}
              onSuccess={() => setEditDialogOpen(false)}
            />
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>Delete Challenge?</AlertDialog.Title>
          <AlertDialog.Description>
            This will permanently delete "{challengeTitle}" and all results.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleConfirmDelete}>Delete</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  )
}
