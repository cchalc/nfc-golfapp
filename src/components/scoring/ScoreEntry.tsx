import { Flex, TextField, Text, Badge } from '@radix-ui/themes'
import type { Hole } from '../../db/collections'

interface ScoreEntryProps {
  hole: Hole
  grossScore: number | null
  handicapStrokes: number
  netScore: number | null
  stablefordPoints: number | null
  onChange: (grossScore: number) => void
  compact?: boolean
}

function getScoreColor(
  netScore: number | null,
  par: number
): 'red' | 'amber' | 'gray' | 'green' | 'blue' {
  if (netScore === null) return 'gray'
  const diff = netScore - par
  if (diff >= 2) return 'red' // Double bogey+
  if (diff === 1) return 'amber' // Bogey
  if (diff === 0) return 'gray' // Par
  if (diff === -1) return 'green' // Birdie
  return 'blue' // Eagle or better
}

export function ScoreEntry({
  hole,
  grossScore,
  handicapStrokes,
  netScore,
  stablefordPoints,
  onChange,
  compact = false,
}: ScoreEntryProps) {
  const scoreColor = getScoreColor(netScore, hole.par)

  if (compact) {
    return (
      <Flex direction="column" align="center" gap="1">
        <Flex align="center" gap="1">
          <Text size="1" color="gray">
            {hole.holeNumber}
          </Text>
          <Badge size="1" variant="soft">
            {hole.par}
          </Badge>
        </Flex>
        <TextField.Root
          size="1"
          type="number"
          min="1"
          max="15"
          value={grossScore ?? ''}
          onChange={(e) => {
            const val = parseInt(e.target.value)
            if (!isNaN(val) && val >= 1) {
              onChange(val)
            }
          }}
          style={{ width: '40px', textAlign: 'center' }}
        />
        {netScore !== null && (
          <Badge size="1" color={scoreColor}>
            {stablefordPoints}
          </Badge>
        )}
      </Flex>
    )
  }

  return (
    <Flex
      align="center"
      justify="between"
      gap="3"
      py="2"
      style={{ borderBottom: '1px solid var(--gray-5)' }}
    >
      <Flex align="center" gap="3" style={{ minWidth: '80px' }}>
        <Text weight="medium" style={{ width: '24px' }}>
          {hole.holeNumber}
        </Text>
        <Flex direction="column">
          <Text size="2">Par {hole.par}</Text>
          <Text size="1" color="gray">
            SI {hole.strokeIndex}
          </Text>
        </Flex>
      </Flex>

      <Flex align="center" gap="3">
        {handicapStrokes > 0 && (
          <Badge variant="soft" color="blue">
            +{handicapStrokes}
          </Badge>
        )}

        <TextField.Root
          type="number"
          min="1"
          max="15"
          value={grossScore ?? ''}
          onChange={(e) => {
            const val = parseInt(e.target.value)
            if (!isNaN(val) && val >= 1) {
              onChange(val)
            }
          }}
          style={{ width: '60px', textAlign: 'center' }}
          placeholder="-"
        />

        <Flex direction="column" align="end" style={{ minWidth: '50px' }}>
          {netScore !== null ? (
            <>
              <Badge color={scoreColor}>{netScore}</Badge>
              <Text size="1" color="gray">
                {stablefordPoints} pts
              </Text>
            </>
          ) : (
            <Text size="2" color="gray">
              -
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
