import { Flex, Text, Button, Avatar, RadioGroup } from '@radix-ui/themes'
import { Trophy } from 'lucide-react'
import type { Challenge, Golfer, ChallengeResult } from '../../db/collections'
import { challengeResultCollection } from '../../db/collections'

interface ChallengeResultEntryProps {
  challenge: Challenge
  golfers: Golfer[]
  existingResults?: ChallengeResult[]
  onSuccess?: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ChallengeResultEntry({
  challenge,
  golfers,
  existingResults = [],
  onSuccess,
}: ChallengeResultEntryProps) {
  // Find existing winner
  const existingWinner = existingResults.find((r) => r.isWinner)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const winnerId = formData.get('winner') as string

    if (!winnerId) return

    // Delete old results for this challenge
    for (const existing of existingResults) {
      challengeResultCollection.delete(existing.id)
    }

    // Insert winner result
    challengeResultCollection.insert({
      id: crypto.randomUUID(),
      challengeId: challenge.id,
      golferId: winnerId,
      resultValue: 'Winner',
      resultNumeric: null,
      isWinner: true,
    })

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} data-testid="result-entry-form">
      <Flex direction="column" gap="4">
        <Text size="2" color="gray">
          Select the winner of this challenge.
        </Text>

        <RadioGroup.Root name="winner" defaultValue={existingWinner?.golferId || ''}>
          <Flex direction="column" gap="2">
            {golfers.map((golfer) => {
              const isCurrentWinner = existingWinner?.golferId === golfer.id

              return (
                <Flex
                  key={golfer.id}
                  align="center"
                  gap="3"
                  p="2"
                  data-testid={`result-golfer-${golfer.id}`}
                  style={{
                    backgroundColor: isCurrentWinner ? 'var(--amber-3)' : 'var(--gray-2)',
                    borderRadius: 'var(--radius-2)',
                  }}
                >
                  <RadioGroup.Item value={golfer.id} />
                  <Avatar
                    size="2"
                    fallback={getInitials(golfer.name)}
                    radius="full"
                  />
                  <Text size="2" style={{ flex: 1 }}>
                    {golfer.name}
                  </Text>
                  {isCurrentWinner && (
                    <Trophy size={16} style={{ color: 'var(--amber-9)' }} />
                  )}
                </Flex>
              )
            })}
          </Flex>
        </RadioGroup.Root>

        <Button type="submit">Save Winner</Button>
      </Flex>
    </form>
  )
}
