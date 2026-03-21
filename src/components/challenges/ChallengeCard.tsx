import { Card, Flex, Text, Badge, Button } from '@radix-ui/themes'
import { Trophy, Trash2, Edit2 } from 'lucide-react'
import type { Challenge, Golfer, Round, Hole } from '../../db/collections'
import { getChallengeColor, getChallengeTypeLabel, isManualChallenge } from '../../lib/challenges'

interface ChallengeCardProps {
  challenge: Challenge
  winner?: Golfer | null
  winnerValue?: string
  round?: Round | null
  hole?: Hole | null
  onEnterResults?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ChallengeCard({
  challenge,
  winner,
  winnerValue,
  round,
  hole,
  onEnterResults,
  onEdit,
  onDelete,
}: ChallengeCardProps) {
  const color = getChallengeColor(challenge.challengeType)
  const typeLabel = getChallengeTypeLabel(challenge.challengeType)
  const needsManualEntry = isManualChallenge(challenge.challengeType)

  // Build scope context string
  let scopeContext = ''
  if (challenge.scope === 'hole' && hole && round) {
    scopeContext = `Round ${round.roundNumber}, Hole ${hole.holeNumber}`
  } else if (challenge.scope === 'round' && round) {
    scopeContext = `Round ${round.roundNumber}`
  } else if (challenge.scope === 'trip') {
    scopeContext = 'Entire Trip'
  }

  return (
    <Card data-testid={`challenge-card-${challenge.id}`}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start">
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
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

          <Flex gap="1">
            {onEdit && (
              <Button variant="ghost" size="1" onClick={onEdit}>
                <Edit2 size={14} />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="1" color="red" onClick={onDelete}>
                <Trash2 size={14} />
              </Button>
            )}
          </Flex>
        </Flex>

        {challenge.description && (
          <Text size="2" color="gray">
            {challenge.description}
          </Text>
        )}

        {challenge.prizeDescription && (
          <Flex align="center" gap="1">
            <Trophy size={12} style={{ color: 'var(--amber-9)' }} />
            <Text size="1" color="gray">
              {challenge.prizeDescription}
            </Text>
          </Flex>
        )}

        {/* Winner display or action button */}
        {winner ? (
          <Flex
            align="center"
            gap="2"
            p="2"
            data-testid={`challenge-winner-${winner.id}`}
            style={{
              backgroundColor: 'var(--amber-3)',
              borderRadius: 'var(--radius-2)',
            }}
          >
            <Trophy size={16} style={{ color: 'var(--amber-9)' }} />
            <Text size="2" weight="medium">
              {winner.name}
            </Text>
          </Flex>
        ) : needsManualEntry && onEnterResults ? (
          <Button variant="soft" size="1" onClick={onEnterResults}>
            Enter Results
          </Button>
        ) : null}
      </Flex>
    </Card>
  )
}
