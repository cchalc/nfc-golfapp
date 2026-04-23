import { Table, Text, Badge, Flex, Avatar, Switch, Tooltip } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import { Trophy, Calculator } from 'lucide-react'
import { useState, useEffect } from 'react'
import { MobileCard } from '../ui/MobileCard'

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
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
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Flex direction="column" gap="2">
        {entries.map((entry) => {
          const isExcluded = entry.included === false
          return (
            <MobileCard
              key={entry.golferId}
              rank={isExcluded ? 0 : entry.rank}
              name={entry.name}
              score={entry.displayValue}
              subtitle={showRounds ? `${entry.rounds} rounds` : undefined}
              highlight={entry.rank === 1 && !isExcluded}
              onClick={() => {
                window.location.href = `/golfers/${entry.golferId}`
              }}
            />
          )
        })}
      </Flex>
    )
  }

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
      <Table.Body data-testid="leaderboard-body">
        {entries.map((entry) => {
          const isExcluded = entry.included === false
          const isLeader = entry.rank === 1 && !isExcluded

          return (
            <Table.Row
              key={entry.golferId}
              className={isLeader ? 'leader-row' : undefined}
              style={isExcluded ? { opacity: 0.5 } : undefined}
              data-testid={`leaderboard-row-${entry.golferId}`}
            >
              <Table.Cell>
                {isExcluded ? (
                  <Text color="gray">—</Text>
                ) : entry.rank <= highlightTop ? (
                  <Flex align="center" gap="1">
                    <Trophy size={14} className={getTrophyClass(entry.rank)} />
                    <Text weight="bold" data-testid={`rank-${entry.golferId}`}>
                      {entry.rank}
                    </Text>
                  </Flex>
                ) : (
                  <Text color="gray" data-testid={`rank-${entry.golferId}`}>
                    {entry.rank}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Link
                  to="/golfers/$golferId"
                  params={{ golferId: entry.golferId }}
                  style={{ textDecoration: 'none' }}
                >
                  <Flex align="center" gap="2">
                    <Avatar
                      size="1"
                      fallback={getInitials(entry.name)}
                      radius="full"
                      color={isLeader ? 'amber' : isExcluded ? 'gray' : undefined}
                    />
                    <Text
                      weight={!isExcluded && entry.rank <= highlightTop ? 'medium' : 'regular'}
                      color={isExcluded ? 'gray' : undefined}
                      data-testid={`golfer-name-${entry.golferId}`}
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
                  color={isLeader ? 'amber' : isExcluded ? 'gray' : undefined}
                  size={isLeader ? '3' : '2'}
                  data-testid={`score-value-${entry.golferId}`}
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
