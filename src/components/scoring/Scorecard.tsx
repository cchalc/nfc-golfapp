import { Flex, Heading, Text, Separator } from '@radix-ui/themes'
import { useMemo, memo } from 'react'
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
  handicapOverride?: number | null // Trip-level handicap override
  readOnly?: boolean // Disable score editing
}

export const Scorecard = memo(function Scorecard({
  golfer,
  holes,
  courseRating,
  slopeRating,
  coursePar,
  scores,
  onScoreChange,
  handicapOverride,
  readOnly = false,
}: ScorecardProps) {
  // Use trip handicap override if provided, otherwise use golfer's default
  const effectiveHandicap = handicapOverride ?? golfer.handicap

  const playingHandicap = useMemo(
    () => getPlayingHandicap(effectiveHandicap, slopeRating, courseRating, coursePar),
    [effectiveHandicap, slopeRating, courseRating, coursePar]
  )

  // Memoize scoreMap
  const scoreMap = useMemo(
    () => new Map(scores.map((s) => [s.holeId, s.grossScore])),
    [scores]
  )

  // Memoize holeData and totals together
  const { holeData, totalGross, totalNet, totalStableford, birdiesOrBetter, holesPlayed } = useMemo(() => {
    let tGross = 0
    let tNet = 0
    let tStableford = 0
    let tBirdies = 0
    let tPlayed = 0

    const data = holes.map((hole) => {
      const grossScore = scoreMap.get(hole.id) ?? null
      const handicapStrokes = getHandicapStrokes(hole.strokeIndex, playingHandicap)

      let netScore: number | null = null
      let stablefordPoints: number | null = null

      if (grossScore !== null) {
        netScore = calculateNetScore(grossScore, handicapStrokes)
        stablefordPoints = calculateStablefordPoints(netScore, hole.par)

        tGross += grossScore
        tNet += netScore
        tStableford += stablefordPoints
        tPlayed++

        if (isBirdieOrBetter(netScore, hole.par)) {
          tBirdies++
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

    return {
      holeData: data,
      totalGross: tGross,
      totalNet: tNet,
      totalStableford: tStableford,
      birdiesOrBetter: tBirdies,
      holesPlayed: tPlayed,
    }
  }, [holes, scoreMap, playingHandicap])

  const frontNine = useMemo(() => holeData.slice(0, 9), [holeData])
  const backNine = useMemo(() => holeData.slice(9, 18), [holeData])

  const frontTotals = useMemo(
    () => frontNine.reduce(
      (acc, h) => ({
        gross: acc.gross + (h.grossScore ?? 0),
        net: acc.net + (h.netScore ?? 0),
        stableford: acc.stableford + (h.stablefordPoints ?? 0),
        par: acc.par + h.hole.par,
      }),
      { gross: 0, net: 0, stableford: 0, par: 0 }
    ),
    [frontNine]
  )

  const backTotals = useMemo(
    () => backNine.reduce(
      (acc, h) => ({
        gross: acc.gross + (h.grossScore ?? 0),
        net: acc.net + (h.netScore ?? 0),
        stableford: acc.stableford + (h.stablefordPoints ?? 0),
        par: acc.par + h.hole.par,
      }),
      { gross: 0, net: 0, stableford: 0, par: 0 }
    ),
    [backNine]
  )

  return (
    <Flex direction="column" gap="4">
      <Flex justify="between" align="center">
        <Flex direction="column" gap="3">
          <Heading size="4">{golfer.name}</Heading>
          <Text size="2" color="gray">
            HCP {effectiveHandicap.toFixed(1)}
            {handicapOverride !== null && handicapOverride !== undefined && (
              <span style={{ color: 'var(--amber-9)' }}> (trip)</span>
            )}{' '}
            → Playing {playingHandicap}
          </Text>
        </Flex>
      </Flex>

      {/* Front 9 */}
      <Flex direction="column" gap="2" data-testid="front-nine">
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
            readOnly={readOnly}
          />
        ))}
        <Flex justify="end" gap="4" py="2" data-testid="front-nine-totals">
          <Text size="2" data-testid="front-nine-gross">
            <span style={{ color: 'var(--gray-11)' }}>Gross:</span> {frontTotals.gross || '-'}
          </Text>
          <Text size="2" data-testid="front-nine-net">
            <span style={{ color: 'var(--gray-11)' }}>Net:</span> {frontTotals.net || '-'}
          </Text>
          <Text size="2" data-testid="front-nine-stableford">
            <span style={{ color: 'var(--gray-11)' }}>Pts:</span> {frontTotals.stableford || '-'}
          </Text>
        </Flex>
      </Flex>

      <Separator size="4" />

      {/* Back 9 */}
      <Flex direction="column" gap="2" data-testid="back-nine">
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
            readOnly={readOnly}
          />
        ))}
        <Flex justify="end" gap="4" py="2" data-testid="back-nine-totals">
          <Text size="2" data-testid="back-nine-gross">
            <span style={{ color: 'var(--gray-11)' }}>Gross:</span> {backTotals.gross || '-'}
          </Text>
          <Text size="2" data-testid="back-nine-net">
            <span style={{ color: 'var(--gray-11)' }}>Net:</span> {backTotals.net || '-'}
          </Text>
          <Text size="2" data-testid="back-nine-stableford">
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
})
