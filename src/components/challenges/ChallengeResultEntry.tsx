import { Flex, Text, TextField, Button, Checkbox, Avatar } from '@radix-ui/themes'
import { Trophy } from 'lucide-react'
import type { Challenge, Golfer, ChallengeResult } from '../../db/collections'
import { challengeResultCollection } from '../../db/collections'
import { parseKpDistance, formatKpDistance, determineWinner } from '../../lib/challenges'

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
  // Build a map of existing results by golferId
  const existingByGolfer = new Map(existingResults.map((r) => [r.golferId, r]))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Collect all results
    const results: Array<{
      golferId: string
      participated: boolean
      resultValue: string
      resultNumeric: number | null
    }> = []

    for (const golfer of golfers) {
      const participated = formData.get(`participated_${golfer.id}`) === 'on'
      const rawValue = formData.get(`value_${golfer.id}`) as string

      if (participated && rawValue?.trim()) {
        const numeric = parseKpDistance(rawValue)
        results.push({
          golferId: golfer.id,
          participated: true,
          resultValue: numeric !== null ? formatKpDistance(numeric) : rawValue,
          resultNumeric: numeric,
        })
      }
    }

    // Determine winner
    const winnerId = determineWinner(results, challenge.challengeType)

    // Delete old results for this challenge
    for (const existing of existingResults) {
      challengeResultCollection.delete(existing.id)
    }

    // Insert new results
    for (const result of results) {
      challengeResultCollection.insert({
        id: crypto.randomUUID(),
        challengeId: challenge.id,
        golferId: result.golferId,
        resultValue: result.resultValue,
        resultNumeric: result.resultNumeric,
        isWinner: result.golferId === winnerId,
      })
    }

    onSuccess?.()
  }

  const isKpOrLd =
    challenge.challengeType === 'closest_to_pin' ||
    challenge.challengeType === 'longest_drive'

  const placeholder =
    challenge.challengeType === 'closest_to_pin'
      ? "4'6\""
      : challenge.challengeType === 'longest_drive'
        ? '285 yards'
        : 'Result'

  return (
    <form onSubmit={handleSubmit} data-testid="result-entry-form">
      <Flex direction="column" gap="4">
        <Text size="2" color="gray">
          Enter results for each participant. The winner will be determined automatically.
        </Text>

        <Flex direction="column" gap="3">
          {golfers.map((golfer) => {
            const existing = existingByGolfer.get(golfer.id)
            const defaultChecked = existing !== undefined
            const defaultValue = existing?.resultValue || ''

            return (
              <Flex
                key={golfer.id}
                align="center"
                gap="3"
                p="2"
                data-testid={`result-golfer-${golfer.id}`}
                style={{
                  backgroundColor: 'var(--gray-2)',
                  borderRadius: 'var(--radius-2)',
                }}
              >
                <Checkbox
                  name={`participated_${golfer.id}`}
                  defaultChecked={defaultChecked}
                />
                <Avatar
                  size="2"
                  fallback={getInitials(golfer.name)}
                  radius="full"
                />
                <Text size="2" style={{ flex: 1, minWidth: 100 }}>
                  {golfer.name}
                </Text>
                <TextField.Root
                  name={`value_${golfer.id}`}
                  placeholder={placeholder}
                  defaultValue={defaultValue}
                  style={{ width: 100 }}
                />
                {existing?.isWinner && (
                  <Trophy size={16} style={{ color: 'var(--amber-9)' }} />
                )}
              </Flex>
            )
          })}
        </Flex>

        {isKpOrLd && (
          <Text size="1" color="gray">
            Enter distance in feet and inches (e.g., 4'6" or 4ft 6in)
          </Text>
        )}

        <Button type="submit">Save Results</Button>
      </Flex>
    </form>
  )
}
