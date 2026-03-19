import { Table, Text, Badge, Flex, Avatar } from '@radix-ui/themes'
import { Trophy } from 'lucide-react'

export interface LeaderboardEntry {
  rank: number
  golferId: string
  name: string
  value: number
  displayValue: string
  rounds?: number
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  valueLabel: string
  showRounds?: boolean
  highlightTop?: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getTrophyClass(rank: number): string {
  if (rank === 1) return 'trophy-gold'
  if (rank === 2) return 'trophy-silver'
  return 'trophy-bronze'
}

export function LeaderboardTable({
  entries,
  valueLabel,
  showRounds = false,
  highlightTop = 3,
}: LeaderboardTableProps) {
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell width="60px">Rank</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Golfer</Table.ColumnHeaderCell>
          {showRounds && <Table.ColumnHeaderCell>Rounds</Table.ColumnHeaderCell>}
          <Table.ColumnHeaderCell align="right">{valueLabel}</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {entries.map((entry) => (
          <Table.Row
            key={entry.golferId}
            className={entry.rank === 1 ? 'leader-row' : undefined}
          >
            <Table.Cell>
              {entry.rank <= highlightTop ? (
                <Flex align="center" gap="1">
                  <Trophy size={14} className={getTrophyClass(entry.rank)} />
                  <Text weight="bold">{entry.rank}</Text>
                </Flex>
              ) : (
                <Text color="gray">{entry.rank}</Text>
              )}
            </Table.Cell>
            <Table.Cell>
              <Flex align="center" gap="2">
                <Avatar
                  size="1"
                  fallback={getInitials(entry.name)}
                  radius="full"
                  color={entry.rank === 1 ? 'amber' : undefined}
                />
                <Text weight={entry.rank <= highlightTop ? 'medium' : 'regular'}>
                  {entry.name}
                </Text>
              </Flex>
            </Table.Cell>
            {showRounds && (
              <Table.Cell>
                <Badge variant="soft" color="amber">
                  {entry.rounds}
                </Badge>
              </Table.Cell>
            )}
            <Table.Cell align="right">
              <Text
                weight="bold"
                style={entry.rank === 1 ? { color: 'var(--amber-9)' } : undefined}
                size={entry.rank === 1 ? '3' : '2'}
              >
                {entry.displayValue}
              </Text>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  )
}
