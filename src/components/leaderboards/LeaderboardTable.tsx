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
          <Table.Row key={entry.golferId}>
            <Table.Cell>
              {entry.rank <= highlightTop ? (
                <Flex align="center" gap="1">
                  <Trophy
                    size={14}
                    style={{
                      color:
                        entry.rank === 1
                          ? 'gold'
                          : entry.rank === 2
                            ? 'silver'
                            : '#cd7f32',
                    }}
                  />
                  <Text weight="bold">{entry.rank}</Text>
                </Flex>
              ) : (
                <Text color="gray">{entry.rank}</Text>
              )}
            </Table.Cell>
            <Table.Cell>
              <Flex align="center" gap="2">
                <Avatar size="1" fallback={getInitials(entry.name)} radius="full" />
                <Text weight={entry.rank <= highlightTop ? 'medium' : 'regular'}>
                  {entry.name}
                </Text>
              </Flex>
            </Table.Cell>
            {showRounds && (
              <Table.Cell>
                <Badge variant="soft" color="gray">
                  {entry.rounds}
                </Badge>
              </Table.Cell>
            )}
            <Table.Cell align="right">
              <Text
                weight="bold"
                color={entry.rank === 1 ? 'blue' : undefined}
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
