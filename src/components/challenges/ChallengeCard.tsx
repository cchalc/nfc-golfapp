import { Card, Flex, Text, Badge, Button, Select, Box } from '@radix-ui/themes'
import { Trophy, Trash2, Edit2 } from 'lucide-react'
import type { Challenge, Golfer, Round, Hole, Course } from '../../db/collections'
import { useUpdateChallenge } from '../../hooks/queries'
import { getChallengeColor, getChallengeTypeLabel, isManualChallenge } from '../../lib/challenges'

interface ChallengeCardProps {
  challenge: Challenge
  winner?: Golfer | null
  winnerValue?: string
  round?: Round | null
  hole?: Hole | null
  course?: Course | null
  holes?: Hole[]
  onCardClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ChallengeCard({
  challenge,
  winner,
  winnerValue,
  round,
  hole,
  course,
  holes,
  onCardClick,
  onEdit,
  onDelete,
}: ChallengeCardProps) {
  const updateChallenge = useUpdateChallenge()
  const color = getChallengeColor(challenge.challengeType)
  const typeLabel = getChallengeTypeLabel(challenge.challengeType)
  const needsManualEntry = isManualChallenge(challenge.challengeType)

  // Build scope context string
  let scopeContext = ''
  if (challenge.scope === 'hole' && hole && course) {
    scopeContext = `${course.name} - Hole ${hole.holeNumber}`
  } else if (challenge.scope === 'hole' && course && !hole) {
    // Has course but no hole assigned yet
    scopeContext = course.name
  } else if (challenge.scope === 'round' && course) {
    scopeContext = course.name
  } else if (challenge.scope === 'trip') {
    scopeContext = 'Entire Trip'
  } else if (challenge.scope === 'hole' && hole && round) {
    // Fallback if no course
    scopeContext = `Round ${round.roundNumber}, Hole ${hole.holeNumber}`
  } else if (challenge.scope === 'round' && round) {
    // Fallback if no course
    scopeContext = `Round ${round.roundNumber}`
  }

  // Handle hole selection for challenges without assigned hole
  const handleHoleSelect = (holeId: string) => {
    updateChallenge.mutate({
      id: challenge.id,
      changes: { holeId },
    })
  }

  // Determine if card should be clickable (manual challenges only)
  const isClickable = needsManualEntry && onCardClick

  return (
    <Card
      data-testid={`challenge-card-${challenge.id}`}
      style={isClickable ? { cursor: 'pointer' } : undefined}
    >
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start">
          <Box
            flexGrow="1"
            onClick={isClickable ? onCardClick : undefined}
            style={isClickable ? { cursor: 'pointer' } : undefined}
          >
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2" wrap="wrap">
                <Badge color={color} variant="soft" data-testid={`challenge-type-${challenge.challengeType}`}>
                  {typeLabel}
                </Badge>
                {scopeContext && (
                  <Text size="1" color="gray">
                    {scopeContext}
                  </Text>
                )}
              </Flex>
              {challenge.name && (
                <Text weight="medium" size="3" data-testid="challenge-name">
                  {challenge.name}
                </Text>
              )}
            </Flex>
          </Box>

          <Flex gap="1" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button variant="ghost" size="1" onClick={onEdit} data-testid="edit-challenge-btn">
                <Edit2 size={14} />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="1" color="red" onClick={onDelete} data-testid="delete-challenge-btn">
                <Trash2 size={14} />
              </Button>
            )}
          </Flex>
        </Flex>

        {/* Inline hole selector when hole not assigned */}
        {challenge.scope === 'hole' && !challenge.holeId && holes && holes.length > 0 && (
          <Box onClick={(e) => e.stopPropagation()}>
            <Select.Root value="" onValueChange={handleHoleSelect} size="1">
              <Select.Trigger placeholder="Select hole" data-testid="hole-selector" />
              <Select.Content>
                {holes.map((h) => (
                  <Select.Item key={h.id} value={h.id}>
                    Hole {h.holeNumber} (Par {h.par})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>
        )}

        {challenge.description && (
          <Box onClick={isClickable ? onCardClick : undefined}>
            <Text size="2" color="gray">
              {challenge.description}
            </Text>
          </Box>
        )}

        {challenge.prizeDescription && (
          <Flex align="center" gap="1" onClick={isClickable ? onCardClick : undefined}>
            <Trophy size={12} style={{ color: 'var(--amber-9)' }} />
            <Text size="1" color="gray">
              {challenge.prizeDescription}
            </Text>
          </Flex>
        )}

        {/* Winner display */}
        {winner && (
          <Flex
            align="center"
            gap="2"
            p="2"
            data-testid={`challenge-winner-${winner.id}`}
            onClick={isClickable ? onCardClick : undefined}
            style={{
              backgroundColor: 'var(--amber-3)',
              borderRadius: 'var(--radius-2)',
              cursor: isClickable ? 'pointer' : undefined,
            }}
          >
            <Trophy size={16} style={{ color: 'var(--amber-9)' }} />
            <Text size="2" weight="medium">
              {winner.name}
            </Text>
            {winnerValue && (
              <Text size="1" color="gray">
                ({winnerValue})
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  )
}
