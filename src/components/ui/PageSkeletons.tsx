import { Card, Flex, Grid, Skeleton } from '@radix-ui/themes'
import { CardSkeleton, StatCardSkeleton } from './Skeleton'

/**
 * Trip Dashboard skeleton - stats grid + rounds list
 */
export function DashboardSkeleton() {
  return (
    <Flex direction="column" gap="6">
      {/* Header */}
      <Flex direction="column" gap="3">
        <Skeleton width="60%" height="36px" className="skeleton-shimmer" />
        <Skeleton width="40%" height="20px" className="skeleton-shimmer" />
      </Flex>

      {/* Stats */}
      <Grid columns={{ initial: '1', sm: '3' }} gap="3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </Grid>

      {/* Quick Links */}
      <Flex direction="column" gap="3">
        <Skeleton width="100px" height="24px" className="skeleton-shimmer" />
        <Grid columns={{ initial: '1', sm: '2' }} gap="3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </Grid>
      </Flex>

      {/* Rounds */}
      <Flex direction="column" gap="3">
        <Skeleton width="80px" height="24px" className="skeleton-shimmer" />
        <CardSkeleton />
        <CardSkeleton />
      </Flex>
    </Flex>
  )
}

/**
 * Leaderboard skeleton - tabs + table rows
 */
export function LeaderboardSkeleton() {
  return (
    <Flex direction="column" gap="5">
      {/* Navigation */}
      <Flex justify="between" align="center">
        <Skeleton width="120px" height="32px" className="skeleton-shimmer" />
        <Flex gap="2">
          <Skeleton width="80px" height="28px" className="skeleton-shimmer" />
          <Skeleton width="80px" height="28px" className="skeleton-shimmer" />
        </Flex>
      </Flex>

      {/* Title */}
      <Flex direction="column" gap="3">
        <Skeleton width="200px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="150px" height="20px" className="skeleton-shimmer" />
      </Flex>

      {/* Tabs */}
      <Flex gap="2">
        <Skeleton width="80px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="80px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="80px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="80px" height="32px" className="skeleton-shimmer" />
      </Flex>

      {/* Table */}
      <Card>
        <Flex direction="column" gap="3" p="3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Flex key={i} justify="between" align="center" py="2">
              <Flex align="center" gap="3">
                <Skeleton width="30px" height="24px" className="skeleton-shimmer" />
                <Skeleton width="120px" height="20px" className="skeleton-shimmer" />
              </Flex>
              <Skeleton width="60px" height="20px" className="skeleton-shimmer" />
            </Flex>
          ))}
        </Flex>
      </Card>
    </Flex>
  )
}

/**
 * Golfers list skeleton - grid of golfer cards
 */
export function GolfersSkeleton() {
  return (
    <Flex direction="column" gap="5">
      {/* Header */}
      <Flex justify="between" align="center">
        <Skeleton width="120px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="100px" height="32px" className="skeleton-shimmer" />
      </Flex>

      {/* Title */}
      <Flex direction="column" gap="3">
        <Skeleton width="180px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="250px" height="20px" className="skeleton-shimmer" />
      </Flex>

      {/* Golfer grid */}
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </Grid>
    </Flex>
  )
}

/**
 * Rounds list skeleton
 */
export function RoundsSkeleton() {
  return (
    <Flex direction="column" gap="5">
      {/* Header */}
      <Flex justify="between" align="center">
        <Skeleton width="120px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="100px" height="32px" className="skeleton-shimmer" />
      </Flex>

      {/* Title */}
      <Skeleton width="150px" height="32px" className="skeleton-shimmer" />

      {/* Round cards */}
      <Flex direction="column" gap="3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <Flex justify="between" align="center" p="3">
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <Skeleton width="60px" height="20px" className="skeleton-shimmer" />
                  <Skeleton width="150px" height="20px" className="skeleton-shimmer" />
                </Flex>
                <Skeleton width="100px" height="16px" className="skeleton-shimmer" />
              </Flex>
              <Skeleton width="20px" height="20px" className="skeleton-shimmer" />
            </Flex>
          </Card>
        ))}
      </Flex>
    </Flex>
  )
}

/**
 * Scorecard skeleton - 18 hole grid
 */
export function ScorecardSkeleton() {
  return (
    <Flex direction="column" gap="5">
      {/* Header */}
      <Flex justify="between" align="center">
        <Skeleton width="120px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="80px" height="28px" className="skeleton-shimmer" />
      </Flex>

      {/* Player info */}
      <Flex direction="column" gap="3">
        <Skeleton width="200px" height="32px" className="skeleton-shimmer" />
        <Flex gap="4">
          <Skeleton width="100px" height="20px" className="skeleton-shimmer" />
          <Skeleton width="100px" height="20px" className="skeleton-shimmer" />
        </Flex>
      </Flex>

      {/* Scorecard grid - Front 9 */}
      <Card>
        <Flex direction="column" gap="2" p="3">
          <Skeleton width="80px" height="20px" className="skeleton-shimmer" />
          <Grid columns="9" gap="2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Flex key={i} direction="column" align="center" gap="1">
                <Skeleton width="24px" height="16px" className="skeleton-shimmer" />
                <Skeleton width="32px" height="32px" className="skeleton-shimmer" />
              </Flex>
            ))}
          </Grid>
        </Flex>
      </Card>

      {/* Scorecard grid - Back 9 */}
      <Card>
        <Flex direction="column" gap="2" p="3">
          <Skeleton width="80px" height="20px" className="skeleton-shimmer" />
          <Grid columns="9" gap="2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Flex key={i} direction="column" align="center" gap="1">
                <Skeleton width="24px" height="16px" className="skeleton-shimmer" />
                <Skeleton width="32px" height="32px" className="skeleton-shimmer" />
              </Flex>
            ))}
          </Grid>
        </Flex>
      </Card>
    </Flex>
  )
}

/**
 * Challenges skeleton
 */
export function ChallengesSkeleton() {
  return (
    <Flex direction="column" gap="5">
      {/* Header */}
      <Flex justify="between" align="center">
        <Skeleton width="120px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="120px" height="32px" className="skeleton-shimmer" />
      </Flex>

      {/* Title */}
      <Skeleton width="150px" height="32px" className="skeleton-shimmer" />

      {/* Challenge cards */}
      <Flex direction="column" gap="3">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </Flex>
    </Flex>
  )
}

/**
 * Teams skeleton
 */
export function TeamsSkeleton() {
  return (
    <Flex direction="column" gap="5">
      {/* Header */}
      <Flex justify="between" align="center">
        <Skeleton width="120px" height="32px" className="skeleton-shimmer" />
        <Skeleton width="100px" height="32px" className="skeleton-shimmer" />
      </Flex>

      {/* Title */}
      <Skeleton width="120px" height="32px" className="skeleton-shimmer" />

      {/* Team cards */}
      <Grid columns={{ initial: '1', sm: '2' }} gap="3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Flex direction="column" gap="3" p="3">
              <Flex align="center" gap="2">
                <Skeleton width="24px" height="24px" style={{ borderRadius: '50%' }} className="skeleton-shimmer" />
                <Skeleton width="120px" height="20px" className="skeleton-shimmer" />
              </Flex>
              <Flex gap="2">
                <Skeleton width="60px" height="24px" className="skeleton-shimmer" />
                <Skeleton width="60px" height="24px" className="skeleton-shimmer" />
              </Flex>
            </Flex>
          </Card>
        ))}
      </Grid>
    </Flex>
  )
}
