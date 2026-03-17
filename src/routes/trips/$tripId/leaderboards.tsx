import { createFileRoute } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Text,
  Tabs,
  Card,
  Badge,
} from '@radix-ui/themes'
import { useLiveQuery, eq, sum, count, min } from '@tanstack/react-db'
import {
  tripCollection,
  golferCollection,
  tripGolferCollection,
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
  const golferMap = new Map((golfers || []).map((g) => [g.id, g]))

  const { data: tripGolfers } = useLiveQuery(
    (q) =>
      q
        .from({ tg: tripGolferCollection })
        .where(({ tg }) => eq(tg.tripId, tripId))
        .where(({ tg }) => eq(tg.status, 'accepted')),
    [tripId]
  )

  const tripGolferIds = new Set((tripGolfers || []).map((tg) => tg.golferId))

  // Stableford Leaderboard (total points)
  const { data: stablefordData } = useLiveQuery(
    (q) =>
      q
        .from({ summary: roundSummaryCollection })
        .groupBy(({ summary }) => summary.golferId)
        .select(({ summary }) => ({
          golferId: summary.golferId,
          totalPoints: sum(summary.totalStableford),
          rounds: count(summary.id),
        }))
        .orderBy(({ $selected }) => $selected.totalPoints, 'desc'),
    []
  )

  // Net Leaderboard (average net)
  const { data: netData } = useLiveQuery(
    (q) =>
      q
        .from({ summary: roundSummaryCollection })
        .groupBy(({ summary }) => summary.golferId)
        .select(({ summary }) => ({
          golferId: summary.golferId,
          bestNet: min(summary.totalNet),
          rounds: count(summary.id),
        }))
        .orderBy(({ $selected }) => $selected.bestNet, 'asc'),
    []
  )

  // Birdies Leaderboard
  const { data: birdiesData } = useLiveQuery(
    (q) =>
      q
        .from({ summary: roundSummaryCollection })
        .groupBy(({ summary }) => summary.golferId)
        .select(({ summary }) => ({
          golferId: summary.golferId,
          totalBirdies: sum(summary.birdiesOrBetter),
          rounds: count(summary.id),
        }))
        .orderBy(({ $selected }) => $selected.totalBirdies, 'desc'),
    []
  )

  // KPs Leaderboard
  const { data: kpsData } = useLiveQuery(
    (q) =>
      q
        .from({ summary: roundSummaryCollection })
        .groupBy(({ summary }) => summary.golferId)
        .select(({ summary }) => ({
          golferId: summary.golferId,
          totalKps: sum(summary.kps),
          rounds: count(summary.id),
        }))
        .orderBy(({ $selected }) => $selected.totalKps, 'desc'),
    []
  )

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

  function filterTripGolfers<T extends { golferId: string }>(data: T[] | undefined): T[] {
    if (!data) return []
    return data.filter((d) => tripGolferIds.has(d.golferId))
  }

  function buildLeaderboard<T extends { golferId: string; rounds: number }>(
    data: T[],
    getValue: (d: T) => number,
    formatValue: (d: T) => string,
    sortAsc: boolean = false
  ): LeaderboardEntry[] {
    const filtered = filterTripGolfers(data)
    const sorted = [...filtered].sort((a, b) => {
      const diff = getValue(a) - getValue(b)
      return sortAsc ? diff : -diff
    })

    let rank = 0
    let lastValue: number | null = null

    return sorted.map((d, idx) => {
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
      }
    })
  }

  const stablefordLeaderboard = buildLeaderboard(
    stablefordData || [],
    (d) => d.totalPoints,
    (d) => `${d.totalPoints} pts`
  )

  const netLeaderboard = buildLeaderboard(
    netData || [],
    (d) => d.bestNet,
    (d) => `${d.bestNet}`,
    true
  )

  const birdiesLeaderboard = buildLeaderboard(
    birdiesData || [],
    (d) => d.totalBirdies,
    (d) => `${d.totalBirdies}`
  )

  const kpsLeaderboard = buildLeaderboard(
    kpsData || [],
    (d) => d.totalKps,
    (d) => `${d.totalKps}`
  )

  // Team leaderboard
  const teamLeaderboard = (teams || [])
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
    .sort((a, b) => b.totalPoints - a.totalPoints)

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
        <Flex direction="column" gap="1">
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
                />
              </Card>
            </Tabs.Content>

            <Tabs.Content value="net">
              <Card mt="4">
                <LeaderboardTable
                  entries={netLeaderboard}
                  valueLabel="Best Net"
                  showRounds
                />
              </Card>
            </Tabs.Content>

            <Tabs.Content value="birdies">
              <Card mt="4">
                <LeaderboardTable
                  entries={birdiesLeaderboard}
                  valueLabel="Total Birdies"
                  showRounds
                />
              </Card>
            </Tabs.Content>

            <Tabs.Content value="kps">
              <Card mt="4">
                <LeaderboardTable
                  entries={kpsLeaderboard}
                  valueLabel="Total KPs"
                  showRounds
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
                            <Flex direction="column">
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
    </Container>
  )
}
