import { Flex, Heading, Text, Separator } from '@radix-ui/themes'
import type { Hole, Golfer } from '../../db/collections'
import { ScoreEntry } from './ScoreEntry'
import { ScoreSummary } from './ScoreSummary'
import {
  getPlayingHandicap,
  getHandicapStrokes,
  calculateNetScore,
  calculateStablefordPoints,
  isBirdieOrBetter,
} from '../../lib/scoring'

interface HoleScore {
  holeId: string
  grossScore: number | null
}

interface ScorecardProps {
  golfer: Golfer
  holes: Hole[]
  courseRating: number | null
  slopeRating: number | null
  coursePar: number
  scores: HoleScore[]
  onScoreChange: (holeId: string, grossScore: number) => void
}

export function Scorecard({
  golfer,
  holes,
  courseRating,
  slopeRating,
  coursePar,
  scores,
  onScoreChange,
}: ScorecardProps) {
  const playingHandicap = getPlayingHandicap(
    golfer.handicap,
    slopeRating,
    courseRating,
    coursePar
  )

  const scoreMap = new Map(scores.map((s) => [s.holeId, s.grossScore]))

  // Calculate totals
  let totalGross = 0
  let totalNet = 0
  let totalStableford = 0
  let birdiesOrBetter = 0
  let holesPlayed = 0

  const holeData = holes.map((hole) => {
    const grossScore = scoreMap.get(hole.id) ?? null
    const handicapStrokes = getHandicapStrokes(hole.strokeIndex, playingHandicap)

    let netScore: number | null = null
    let stablefordPoints: number | null = null

    if (grossScore !== null) {
      netScore = calculateNetScore(grossScore, handicapStrokes)
      stablefordPoints = calculateStablefordPoints(netScore, hole.par)

      totalGross += grossScore
      totalNet += netScore
      totalStableford += stablefordPoints
      holesPlayed++

      if (isBirdieOrBetter(netScore, hole.par)) {
        birdiesOrBetter++
      }
    }

    return {
      hole,
      grossScore,
      handicapStrokes,
      netScore,
      stablefordPoints,
    }
  })

  const frontNine = holeData.slice(0, 9)
  const backNine = holeData.slice(9, 18)

  const frontTotals = frontNine.reduce(
    (acc, h) => ({
      gross: acc.gross + (h.grossScore ?? 0),
      net: acc.net + (h.netScore ?? 0),
      stableford: acc.stableford + (h.stablefordPoints ?? 0),
      par: acc.par + h.hole.par,
    }),
    { gross: 0, net: 0, stableford: 0, par: 0 }
  )

  const backTotals = backNine.reduce(
    (acc, h) => ({
      gross: acc.gross + (h.grossScore ?? 0),
      net: acc.net + (h.netScore ?? 0),
      stableford: acc.stableford + (h.stablefordPoints ?? 0),
      par: acc.par + h.hole.par,
    }),
    { gross: 0, net: 0, stableford: 0, par: 0 }
  )

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center">
        <Flex direction="column" gap="2">
          <Heading size="4">{golfer.name}</Heading>
          <Text size="2" color="gray">
            HCP {golfer.handicap.toFixed(1)} → Playing {playingHandicap}
          </Text>
        </Flex>
      </Flex>

      {/* Front 9 */}
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="2" weight="medium">
            Front 9
          </Text>
          <Text size="2" color="gray">
            Par {frontTotals.par}
          </Text>
        </Flex>
        {frontNine.map((h) => (
          <ScoreEntry
            key={h.hole.id}
            hole={h.hole}
            grossScore={h.grossScore}
            handicapStrokes={h.handicapStrokes}
            netScore={h.netScore}
            stablefordPoints={h.stablefordPoints}
            onChange={(gross) => onScoreChange(h.hole.id, gross)}
          />
        ))}
        <Flex justify="end" gap="4" py="2">
          <Text size="2">
            <span style={{ color: 'var(--gray-11)' }}>Gross:</span> {frontTotals.gross || '-'}
          </Text>
          <Text size="2">
            <span style={{ color: 'var(--gray-11)' }}>Net:</span> {frontTotals.net || '-'}
          </Text>
          <Text size="2">
            <span style={{ color: 'var(--gray-11)' }}>Pts:</span> {frontTotals.stableford || '-'}
          </Text>
        </Flex>
      </Flex>

      <Separator size="4" />

      {/* Back 9 */}
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Text size="2" weight="medium">
            Back 9
          </Text>
          <Text size="2" color="gray">
            Par {backTotals.par}
          </Text>
        </Flex>
        {backNine.map((h) => (
          <ScoreEntry
            key={h.hole.id}
            hole={h.hole}
            grossScore={h.grossScore}
            handicapStrokes={h.handicapStrokes}
            netScore={h.netScore}
            stablefordPoints={h.stablefordPoints}
            onChange={(gross) => onScoreChange(h.hole.id, gross)}
          />
        ))}
        <Flex justify="end" gap="4" py="2">
          <Text size="2">
            <span style={{ color: 'var(--gray-11)' }}>Gross:</span> {backTotals.gross || '-'}
          </Text>
          <Text size="2">
            <span style={{ color: 'var(--gray-11)' }}>Net:</span> {backTotals.net || '-'}
          </Text>
          <Text size="2">
            <span style={{ color: 'var(--gray-11)' }}>Pts:</span> {backTotals.stableford || '-'}
          </Text>
        </Flex>
      </Flex>

      <Separator size="4" />

      {/* Total Summary */}
      {holesPlayed > 0 && (
        <ScoreSummary
          totalGross={totalGross}
          totalNet={totalNet}
          totalStableford={totalStableford}
          coursePar={coursePar}
          birdiesOrBetter={birdiesOrBetter}
        />
      )}
    </Flex>
  )
}
