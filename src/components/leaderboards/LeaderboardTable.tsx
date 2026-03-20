import { Table, Text, Badge, Flex, Avatar, Switch, Tooltip } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import { Trophy, Calculator } from 'lucide-react'

export interface LeaderboardEntry {
  rank: number
  golferId: string
  name: string
  value: number
  displayValue: string
  rounds?: number
  included?: boolean
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  valueLabel: string
  showRounds?: boolean
  highlightTop?: number
  onToggleGolfer?: (golferId: string) => void
  onClickRounds?: (golferId: string) => void
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
  onToggleGolfer,
  onClickRounds,
}: LeaderboardTableProps) {
  const showToggle = !!onToggleGolfer

  return (
    <div className="table-scroll-mobile">
      <Table.Root style={{ minWidth: '400px' }}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell width="60px">Rank</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Golfer</Table.ColumnHeaderCell>
            {showRounds && (
              <Table.ColumnHeaderCell className="hide-mobile">Rounds</Table.ColumnHeaderCell>
            )}
            <Table.ColumnHeaderCell align="right">{valueLabel}</Table.ColumnHeaderCell>
            {showToggle && (
              <Table.ColumnHeaderCell width="60px" align="center" className="hide-mobile">
                <Tooltip content="Include in scoring">
                  <Calculator size={14} />
                </Tooltip>
              </Table.ColumnHeaderCell>
            )}
          </Table.Row>
        </Table.Header>
      <Table.Body>
        {entries.map((entry) => {
          const isExcluded = entry.included === false
          const isLeader = entry.rank === 1 && !isExcluded

          return (
            <Table.Row
              key={entry.golferId}
              className={isLeader ? 'leader-row' : undefined}
              style={isExcluded ? { opacity: 0.5 } : undefined}
            >
              <Table.Cell>
                {isExcluded ? (
                  <Text color="gray">—</Text>
                ) : entry.rank <= highlightTop ? (
                  <Flex align="center" gap="1">
                    <Trophy size={14} className={getTrophyClass(entry.rank)} />
                    <Text weight="bold">{entry.rank}</Text>
                  </Flex>
                ) : (
                  <Text color="gray">{entry.rank}</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Link
                  to="/golfers/$golferId"
                  params={{ golferId: entry.golferId }}
                  style={{ textDecoration: 'none' }}
                >
                  <Flex align="center" gap="2" style={{ cursor: 'pointer' }}>
                    <Avatar
                      size="1"
                      fallback={getInitials(entry.name)}
                      radius="full"
                      color={isLeader ? 'amber' : isExcluded ? 'gray' : undefined}
                    />
                    <Text
                      weight={!isExcluded && entry.rank <= highlightTop ? 'medium' : 'regular'}
                      color={isExcluded ? 'gray' : undefined}
                    >
                      {entry.name}
                    </Text>
                  </Flex>
                </Link>
              </Table.Cell>
              {showRounds && (
                <Table.Cell className="hide-mobile">
                  <Badge
                    variant="soft"
                    color={isExcluded ? 'gray' : 'amber'}
                    style={onClickRounds ? { cursor: 'pointer' } : undefined}
                    onClick={onClickRounds ? () => onClickRounds(entry.golferId) : undefined}
                  >
                    {entry.rounds}
                  </Badge>
                </Table.Cell>
              )}
              <Table.Cell align="right">
                <Text
                  weight={isExcluded ? 'regular' : 'bold'}
                  style={isLeader ? { color: 'var(--amber-9)' } : undefined}
                  size={isLeader ? '3' : '2'}
                  color={isExcluded ? 'gray' : undefined}
                >
                  {entry.displayValue}
                </Text>
              </Table.Cell>
              {showToggle && (
                <Table.Cell align="center" className="hide-mobile">
                  <Switch
                    size="1"
                    checked={!isExcluded}
                    onCheckedChange={() => onToggleGolfer(entry.golferId)}
                  />
                </Table.Cell>
              )}
            </Table.Row>
          )
        })}
      </Table.Body>
    </Table.Root>
    </div>
  )
}
