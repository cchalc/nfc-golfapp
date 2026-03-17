import { Card, Flex, Text, Avatar, Badge } from '@radix-ui/themes'
import type { Golfer } from '../../db/collections'

interface GolferCardProps {
  golfer: Golfer
  showHandicap?: boolean
  onClick?: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function GolferCard({ golfer, showHandicap = true, onClick }: GolferCardProps) {
  const CardContent = (
    <Card asChild={!!onClick}>
      <Flex align="center" gap="3">
        <Avatar
          size="3"
          src={golfer.profileImageUrl || undefined}
          fallback={getInitials(golfer.name)}
          radius="full"
        />
        <Flex direction="column" gap="1" style={{ flex: 1 }}>
          <Text weight="medium">{golfer.name}</Text>
          {golfer.email && (
            <Text size="1" color="gray">
              {golfer.email}
            </Text>
          )}
        </Flex>
        {showHandicap && (
          <Badge variant="soft" color="blue">
            HCP {golfer.handicap.toFixed(1)}
          </Badge>
        )}
      </Flex>
    </Card>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'block',
          width: '100%',
        }}
      >
        {CardContent}
      </button>
    )
  }

  return CardContent
}
