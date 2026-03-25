import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Text,
  Tabs,
  Card,
  Badge,
  Dialog,
  Button,
  Switch,
} from '@radix-ui/themes'
import { ArrowLeft, Users, Flag, Target } from 'lucide-react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { useState, useMemo } from 'react'
import {
  tripCollection,
  golferCollection,
  tripGolferCollection,
  roundCollection,
  courseCollection,
  roundSummaryCollection,
  teamCollection,
  teamMemberCollection,
} from '../../../db/collections'
import {
  LeaderboardTable,
  type LeaderboardEntry,
} from '../../../components/leaderboards/LeaderboardTable'
import { EmptyState } from '../../../components/ui/EmptyState'

export const Route = createFileRoute('/trips/$tripId/leaderboards')({
  ssr: false,
  component: LeaderboardsPage,
})

function LeaderboardsPage() {
  const { tripId } = Route.useParams()

  const { data: trips } = useLiveQuery(
    (q) => q.from({ trip: tripCollection }).where(({ trip }) => eq(trip.id, tripId)),
    [tripId]
  )
  const trip = trips?.[0]

  const { data: golfers } = useLiveQuery(
    (q) => q.from({ golfer: golferCollection }),
    []
  )
  const golferMap = useMemo(
    () => new Map((golfers || []).map((g) => [g.id, g])),
    [golfers]
  )

  const { data: tripGolfers } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.tripId, tripId))
        .where(({ tg }) => eq(tg.status, 'accepted')),
    [tripId]
  )

  const { tripGolferIds, includedGolferIds, tripGolferMap } = useMemo(() => ({
    tripGolferIds: new Set((tripGolfers || []).map((tg) => tg.golferId)),
    includedGolferIds: new Set(
      (tripGolfers || []).filter((tg) => tg.includedInScoring).map((tg) => tg.golferId)
    ),
    tripGolferMap: new Map((tripGolfers || []).map((tg) => [tg.golferId, tg])),
  }), [tripGolfers])

  function toggleGolferScoring(golferId: string) {
    const tg = tripGolferMap.get(golferId)
    if (tg) {
      tripGolferCollection.update(tg.id, (draft) => {
        draft.includedInScoring = !draft.includedInScoring
      })
    }
  }

  // State for round selection dialog
  const [selectedGolferId, setSelectedGolferId] = useState<string | null>(null)

  // Get all rounds for this trip
  const { data: allRounds } = useLiveQuery(
    (q) =>
      q
        .from({ round: roundCollection })
        .where(({ round }) => eq(round.tripId, tripId))
        .orderBy(({ round }) => round.roundNumber, 'asc'),
    [tripId]
  )
  const roundMap = useMemo(
    () => new Map((allRounds || []).map((r) => [r.id, r])),
    [allRounds]
  )

  // Get included rounds (trip-level)
  const includedRoundIds = useMemo(
    () => new Set((allRounds || []).filter((r) => r.includedInScoring).map((r) => r.id)),
    [allRounds]
  )

  // Get courses for round names
  const { data: courses } = useLiveQuery(
    (q) => q.from({ course: courseCollection }),
    []
  )
  const courseMap = useMemo(
    () => new Map((courses || []).map((c) => [c.id, c])),
    [courses]
  )

  // Get all round summaries
  const { data: allSummaries } = useLiveQuery(
    (q) => q.from({ summary: roundSummaryCollection }),
    []
  )

  // Filter summaries to only included rounds from this trip AND where summary.includedInScoring is true
  const tripSummaries = useMemo(
    () => (allSummaries || []).filter(
      (s) => includedRoundIds.has(s.roundId) && s.includedInScoring !== false
    ),
    [allSummaries, includedRoundIds]
  )

  // Get summaries for selected golfer (for round selection dialog)
  const selectedGolferSummaries = selectedGolferId
    ? (allSummaries || []).filter(
        (s) => s.golferId === selectedGolferId && includedRoundIds.has(s.roundId)
      )
    : []

  function toggleRoundForGolfer(summaryId: string, currentValue: boolean) {
    roundSummaryCollection.update(summaryId, (draft) => {
      draft.includedInScoring = !currentValue
    })
  }

  // Memoized aggregations - only recalculate when tripSummaries changes
  const { stablefordData, netData, birdiesData, kpsData } = useMemo(() => {
    // Aggregate Stableford data
    const stablefordByGolfer = new Map<string, { totalPoints: number; rounds: number }>()
    for (const summary of tripSummaries) {
      const existing = stablefordByGolfer.get(summary.golferId) || { totalPoints: 0, rounds: 0 }
      stablefordByGolfer.set(summary.golferId, {
        totalPoints: existing.totalPoints + summary.totalStableford,
        rounds: existing.rounds + 1,
      })
    }
    const stablefordData = Array.from(stablefordByGolfer.entries())
      .map(([golferId, data]) => ({ golferId, ...data }))
      .sort((a, b) => b.totalPoints - a.totalPoints)

    // Aggregate Net data (best net)
    const netByGolfer = new Map<string, { bestNet: number; rounds: number }>()
    for (const summary of tripSummaries) {
      const existing = netByGolfer.get(summary.golferId)
      if (!existing || summary.totalNet < existing.bestNet) {
        netByGolfer.set(summary.golferId, {
          bestNet: summary.totalNet,
          rounds: (existing?.rounds || 0) + 1,
        })
      } else {
        netByGolfer.set(summary.golferId, {
          ...existing,
          rounds: existing.rounds + 1,
        })
      }
    }
    const netData = Array.from(netByGolfer.entries())
      .map(([golferId, data]) => ({ golferId, ...data }))
      .sort((a, b) => a.bestNet - b.bestNet)

    // Aggregate Birdies data
    const birdiesByGolfer = new Map<string, { totalBirdies: number; rounds: number }>()
    for (const summary of tripSummaries) {
      const existing = birdiesByGolfer.get(summary.golferId) || { totalBirdies: 0, rounds: 0 }
      birdiesByGolfer.set(summary.golferId, {
        totalBirdies: existing.totalBirdies + summary.birdiesOrBetter,
        rounds: existing.rounds + 1,
      })
    }
    const birdiesData = Array.from(birdiesByGolfer.entries())
      .map(([golferId, data]) => ({ golferId, ...data }))
      .sort((a, b) => b.totalBirdies - a.totalBirdies)

    // Aggregate KPs data
    const kpsByGolfer = new Map<string, { totalKps: number; rounds: number }>()
    for (const summary of tripSummaries) {
      const existing = kpsByGolfer.get(summary.golferId) || { totalKps: 0, rounds: 0 }
      kpsByGolfer.set(summary.golferId, {
        totalKps: existing.totalKps + summary.kps,
        rounds: existing.rounds + 1,
      })
    }
    const kpsData = Array.from(kpsByGolfer.entries())
      .map(([golferId, data]) => ({ golferId, ...data }))
      .sort((a, b) => b.totalKps - a.totalKps)

    return { stablefordData, netData, birdiesData, kpsData }
  }, [tripSummaries])

  // Teams
  const { data: teams } = useLiveQuery(
    (q) =>
      q.from({ team: teamCollection }).where(({ team }) => eq(team.tripId, tripId)),
    [tripId]
  )

  const { data: teamMembers } = useLiveQuery(
    (q) =>
      q
        .from({ tm: teamMemberCollection })
        .where(({ tm }) => eq(tm.tripId, tripId)),
    [tripId]
  )

  function buildLeaderboard<T extends { golferId: string; rounds: number }>(
    data: T[],
    getValue: (d: T) => number,
    formatValue: (d: T) => string,
    sortAsc: boolean = false
  ): LeaderboardEntry[] {
    // Filter to trip golfers only
    const tripData = data.filter((d) => tripGolferIds.has(d.golferId))

    // Separate included and excluded golfers
    const includedData = tripData.filter((d) => includedGolferIds.has(d.golferId))
    const excludedData = tripData.filter((d) => !includedGolferIds.has(d.golferId))

    // Sort included golfers for ranking
    const sortedIncluded = [...includedData].sort((a, b) => {
      const diff = getValue(a) - getValue(b)
      return sortAsc ? diff : -diff
    })

    let rank = 0
    let lastValue: number | null = null

    const includedEntries: LeaderboardEntry[] = sortedIncluded.map((d, idx) => {
      const value = getValue(d)
      if (value !== lastValue) {
        rank = idx + 1
        lastValue = value
      }

      const golfer = golferMap.get(d.golferId)
      return {
        rank,
        golferId: d.golferId,
        name: golfer?.name || 'Unknown',
        value,
        displayValue: formatValue(d),
        rounds: d.rounds,
        included: true,
      }
    })

    // Add excluded golfers at the end with no rank
    const excludedEntries: LeaderboardEntry[] = excludedData.map((d) => {
      const golfer = golferMap.get(d.golferId)
      return {
        rank: 0,
        golferId: d.golferId,
        name: golfer?.name || 'Unknown',
        value: getValue(d),
        displayValue: formatValue(d),
        rounds: d.rounds,
        included: false,
      }
    })

    return [...includedEntries, ...excludedEntries]
  }

  // Memoize leaderboard arrays
  const stablefordLeaderboard = useMemo(
    () => buildLeaderboard(
      stablefordData,
      (d) => d.totalPoints,
      (d) => `${d.totalPoints} pts`
    ),
    [stablefordData, tripGolferIds, includedGolferIds, golferMap]
  )

  const netLeaderboard = useMemo(
    () => buildLeaderboard(
      netData,
      (d) => d.bestNet,
      (d) => `${d.bestNet}`,
      true
    ),
    [netData, tripGolferIds, includedGolferIds, golferMap]
  )

  const birdiesLeaderboard = useMemo(
    () => buildLeaderboard(
      birdiesData,
      (d) => d.totalBirdies,
      (d) => `${d.totalBirdies}`
    ),
    [birdiesData, tripGolferIds, includedGolferIds, golferMap]
  )

  const kpsLeaderboard = useMemo(
    () => buildLeaderboard(
      kpsData,
      (d) => d.totalKps,
      (d) => `${d.totalKps}`
    ),
    [kpsData, tripGolferIds, includedGolferIds, golferMap]
  )

  // Team leaderboard
  const teamLeaderboard = useMemo(
    () => (teams || [])
      .map((team) => {
        const members = (teamMembers || []).filter((tm) => tm.teamId === team.id)
        const memberIds = members.map((m) => m.golferId)

        const memberPoints = (stablefordData || [])
          .filter((d) => memberIds.includes(d.golferId))
          .reduce((sum, d) => sum + d.totalPoints, 0)

        return {
          team,
          totalPoints: memberPoints,
          memberCount: members.length,
        }
      })
      .sort((a, b) => b.totalPoints - a.totalPoints),
    [teams, teamMembers, stablefordData]
  )

  if (!trip) {
    return (
      <Container size="2" py="6">
        <Text>Trip not found</Text>
      </Container>
    )
  }

  const hasData = stablefordLeaderboard.length > 0

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="5">
        {/* Navigation */}
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Link to="/trips/$tripId" params={{ tripId }}>
            <Button variant="ghost" size="1">
              <ArrowLeft size={16} />
              Back to Trip
            </Button>
          </Link>
          <Flex gap="2">
            <Link to="/trips/$tripId/golfers" params={{ tripId }}>
              <Button variant="soft" size="1">
                <Users size={14} />
                Golfers
              </Button>
            </Link>
            <Link to="/trips/$tripId/teams" params={{ tripId }}>
              <Button variant="soft" size="1">
                <Flag size={14} />
                Teams
              </Button>
            </Link>
            <Link to="/trips/$tripId/challenges" params={{ tripId }}>
              <Button variant="soft" size="1">
                <Target size={14} />
                Challenges
              </Button>
            </Link>
          </Flex>
        </Flex>

        <Flex direction="column" gap="3">
          <Heading size="7">Leaderboards</Heading>
          <Text color="gray">{trip.name}</Text>
        </Flex>

        {hasData ? (
          <Tabs.Root defaultValue="stableford">
            <Tabs.List>
              <Tabs.Trigger value="stableford">Stableford</Tabs.Trigger>
              <Tabs.Trigger value="net">Best Net</Tabs.Trigger>
              <Tabs.Trigger value="birdies">Birdies</Tabs.Trigger>
              <Tabs.Trigger value="kps">KPs</Tabs.Trigger>
              {teams && teams.length > 0 && (
                <Tabs.Trigger value="teams">Teams</Tabs.Trigger>
              )}
            </Tabs.List>

            <Tabs.Content value="stableford">
              <Card mt="4">
                <LeaderboardTable
                  entries={stablefordLeaderboard}
                  valueLabel="Total Points"
                  showRounds
                  onToggleGolfer={toggleGolferScoring}
                  onClickRounds={setSelectedGolferId}
                />
              </Card>
            </Tabs.Content>

            <Tabs.Content value="net">
              <Card mt="4">
                <LeaderboardTable
                  entries={netLeaderboard}
                  valueLabel="Best Net"
                  showRounds
                  onToggleGolfer={toggleGolferScoring}
                  onClickRounds={setSelectedGolferId}
                />
              </Card>
            </Tabs.Content>

            <Tabs.Content value="birdies">
              <Card mt="4">
                <LeaderboardTable
                  entries={birdiesLeaderboard}
                  valueLabel="Total Birdies"
                  showRounds
                  onToggleGolfer={toggleGolferScoring}
                  onClickRounds={setSelectedGolferId}
                />
              </Card>
            </Tabs.Content>

            <Tabs.Content value="kps">
              <Card mt="4">
                <LeaderboardTable
                  entries={kpsLeaderboard}
                  valueLabel="Total KPs"
                  showRounds
                  onToggleGolfer={toggleGolferScoring}
                  onClickRounds={setSelectedGolferId}
                />
              </Card>
            </Tabs.Content>

            {teams && teams.length > 0 && (
              <Tabs.Content value="teams">
                <Card mt="4">
                  <Flex direction="column" gap="3">
                    {teamLeaderboard.map((item, idx) => (
                      <Card key={item.team.id}>
                        <Flex justify="between" align="center">
                          <Flex align="center" gap="3">
                            <Badge
                              size="2"
                              style={{ backgroundColor: item.team.color }}
                            >
                              #{idx + 1}
                            </Badge>
                            <Flex direction="column" gap="2">
                              <Text weight="bold">{item.team.name}</Text>
                              <Text size="1" color="gray">
                                {item.memberCount} members
                              </Text>
                            </Flex>
                          </Flex>
                          <Text size="5" weight="bold" color="blue">
                            {item.totalPoints} pts
                          </Text>
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                </Card>
              </Tabs.Content>
            )}
          </Tabs.Root>
        ) : (
          <EmptyState
            title="No scores yet"
            description="Start entering scores to see the leaderboards"
          />
        )}
      </Flex>

      {/* Round Selection Dialog */}
      <Dialog.Root open={!!selectedGolferId} onOpenChange={(open) => !open && setSelectedGolferId(null)}>
        <Dialog.Content maxWidth="400px">
          <Dialog.Title>
            Select Rounds for {selectedGolferId ? golferMap.get(selectedGolferId)?.name : ''}
          </Dialog.Title>
          <Dialog.Description size="2" color="gray">
            Choose which rounds to include in scoring calculations
          </Dialog.Description>
          <Flex direction="column" gap="3" pt="4">
            {selectedGolferSummaries.map((summary) => {
              const round = roundMap.get(summary.roundId)
              const course = round ? courseMap.get(round.courseId) : null
              const isIncluded = summary.includedInScoring !== false

              return (
                <Card key={summary.id} size="1">
                  <Flex justify="between" align="center">
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <Badge size="1">R{round?.roundNumber}</Badge>
                        <Text size="2" weight="medium">
                          {course?.name || 'Unknown Course'}
                        </Text>
                      </Flex>
                      <Flex gap="3">
                        <Text size="1" color="gray">
                          Gross: {summary.totalGross}
                        </Text>
                        <Text size="1" color="gray">
                          Net: {summary.totalNet}
                        </Text>
                        <Text size="1" color="gray">
                          Pts: {summary.totalStableford}
                        </Text>
                      </Flex>
                    </Flex>
                    <Switch
                      size="1"
                      checked={isIncluded}
                      onCheckedChange={() => toggleRoundForGolfer(summary.id, isIncluded)}
                    />
                  </Flex>
                </Card>
              )
            })}
            {selectedGolferSummaries.length === 0 && (
              <Text size="2" color="gray" align="center">
                No rounds found for this golfer
              </Text>
            )}
          </Flex>
          <Flex justify="end" pt="4">
            <Button variant="soft" onClick={() => setSelectedGolferId(null)}>
              Done
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  )
}
