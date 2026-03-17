import { createFileRoute } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Badge,
  Button,
  TextField,
  Dialog,
  Avatar,
} from '@radix-ui/themes'
import { Plus, X } from 'lucide-react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  tripCollection,
  golferCollection,
  tripGolferCollection,
  teamCollection,
  teamMemberCollection,
} from '../../../db/collections'
import { EmptyState } from '../../../components/ui/EmptyState'

export const Route = createFileRoute('/trips/$tripId/teams')({
  ssr: false,
  component: TeamsPage,
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const TEAM_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
]

function TeamsPage() {
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

  const { data: teams } = useLiveQuery(
    (q) =>
      q
        .from({ team: teamCollection })
        .where(({ team }) => eq(team.tripId, tripId))
        .orderBy(({ team }) => team.name, 'asc'),
    [tripId]
  )

  const { data: teamMembers } = useLiveQuery(
    (q) =>
      q
        .from({ tm: teamMemberCollection })
        .where(({ tm }) => eq(tm.tripId, tripId)),
    [tripId]
  )

  const membersByTeam = new Map<string, string[]>()
  const assignedGolferIds = new Set<string>()

  for (const tm of teamMembers || []) {
    const members = membersByTeam.get(tm.teamId) || []
    members.push(tm.golferId)
    membersByTeam.set(tm.teamId, members)
    assignedGolferIds.add(tm.golferId)
  }

  const tripGolferIds = (tripGolfers || []).map((tg) => tg.golferId)
  const unassignedGolfers = tripGolferIds
    .filter((id) => !assignedGolferIds.has(id))
    .map((id) => golferMap.get(id))
    .filter((g): g is NonNullable<typeof g> => !!g)

  function handleCreateTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const color = formData.get('color') as string

    teamCollection.insert({
      id: crypto.randomUUID(),
      tripId,
      name,
      color: color || TEAM_COLORS[teams?.length || 0]?.value || '#3b82f6',
    })

    // Close dialog
    const closeButton = document.querySelector(
      '[data-radix-dialog-close]'
    ) as HTMLButtonElement
    closeButton?.click()
  }

  function addToTeam(teamId: string, golferId: string) {
    teamMemberCollection.insert({
      id: crypto.randomUUID(),
      teamId,
      golferId,
      tripId,
    })
  }

  function removeFromTeam(golferId: string) {
    const member = (teamMembers || []).find((tm) => tm.golferId === golferId)
    if (member) {
      teamMemberCollection.delete(member.id)
    }
  }

  function deleteTeam(teamId: string) {
    // Remove all members first
    const members = (teamMembers || []).filter((tm) => tm.teamId === teamId)
    for (const m of members) {
      teamMemberCollection.delete(m.id)
    }
    teamCollection.delete(teamId)
  }

  if (!trip) {
    return (
      <Container size="2" py="6">
        <Text>Trip not found</Text>
      </Container>
    )
  }

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="5">
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Heading size="7">Teams</Heading>
            <Text color="gray">{trip.name}</Text>
          </Flex>

          <Dialog.Root>
            <Dialog.Trigger>
              <Button>
                <Plus size={16} />
                Add Team
              </Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="350px">
              <Dialog.Title>Create Team</Dialog.Title>
              <form onSubmit={handleCreateTeam}>
                <Flex direction="column" gap="4" pt="2">
                  <Flex direction="column" gap="1">
                    <Text as="label" size="2" weight="medium">
                      Team Name
                    </Text>
                    <TextField.Root
                      name="name"
                      placeholder="Team Alpha"
                      required
                    />
                  </Flex>

                  <Flex direction="column" gap="2">
                    <Text size="2" weight="medium">
                      Color
                    </Text>
                    <Flex gap="2" wrap="wrap">
                      {TEAM_COLORS.map((color, idx) => (
                        <label key={color.value}>
                          <input
                            type="radio"
                            name="color"
                            value={color.value}
                            defaultChecked={idx === (teams?.length || 0) % TEAM_COLORS.length}
                            style={{ display: 'none' }}
                          />
                          <Badge
                            size="2"
                            style={{
                              backgroundColor: color.value,
                              cursor: 'pointer',
                            }}
                          >
                            {color.name}
                          </Badge>
                        </label>
                      ))}
                    </Flex>
                  </Flex>

                  <Button type="submit">Create Team</Button>
                </Flex>
              </form>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        {teams && teams.length > 0 ? (
          <Flex direction="column" gap="4">
            {teams.map((team) => {
              const members = membersByTeam.get(team.id) || []
              return (
                <Card key={team.id}>
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="2">
                        <Badge size="2" style={{ backgroundColor: team.color }}>
                          {team.name}
                        </Badge>
                        <Text size="2" color="gray">
                          {members.length} members
                        </Text>
                      </Flex>
                      <Button
                        variant="ghost"
                        color="red"
                        size="1"
                        onClick={() => deleteTeam(team.id)}
                      >
                        Delete
                      </Button>
                    </Flex>

                    {members.length > 0 ? (
                      <Flex gap="2" wrap="wrap">
                        {members.map((golferId) => {
                          const golfer = golferMap.get(golferId)
                          if (!golfer) return null
                          return (
                            <Badge key={golferId} variant="soft" size="2">
                              <Flex align="center" gap="1">
                                <Avatar
                                  size="1"
                                  fallback={getInitials(golfer.name)}
                                  radius="full"
                                />
                                {golfer.name}
                                <button
                                  type="button"
                                  onClick={() => removeFromTeam(golferId)}
                                  style={{
                                    all: 'unset',
                                    cursor: 'pointer',
                                    display: 'flex',
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </Flex>
                            </Badge>
                          )
                        })}
                      </Flex>
                    ) : (
                      <Text size="2" color="gray">
                        No members yet
                      </Text>
                    )}

                    {unassignedGolfers.length > 0 && (
                      <Flex gap="2" wrap="wrap">
                        {unassignedGolfers.map((golfer) => (
                          <Button
                            key={golfer.id}
                            variant="soft"
                            size="1"
                            onClick={() => addToTeam(team.id, golfer.id)}
                          >
                            <Plus size={12} />
                            {golfer.name}
                          </Button>
                        ))}
                      </Flex>
                    )}
                  </Flex>
                </Card>
              )
            })}
          </Flex>
        ) : (
          <EmptyState
            title="No teams yet"
            description="Create teams to track team competitions"
            action={
              <Dialog.Root>
                <Dialog.Trigger>
                  <Button>
                    <Plus size={16} />
                    Create Team
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content maxWidth="350px">
                  <Dialog.Title>Create Team</Dialog.Title>
                  <form onSubmit={handleCreateTeam}>
                    <Flex direction="column" gap="4" pt="2">
                      <TextField.Root
                        name="name"
                        placeholder="Team Name"
                        required
                      />
                      <Button type="submit">Create Team</Button>
                    </Flex>
                  </form>
                </Dialog.Content>
              </Dialog.Root>
            }
          />
        )}
      </Flex>
    </Container>
  )
}
