# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Golf Trip Planner app blazing fast with instant navigation, loading states, and offline-first capability.

**Architecture:** Rewrite TripDataContext to track sync status by priority tier (critical/high/normal). Each trip page renders immediately with skeleton UI, then swaps in content when required data is ready. Collections are created once on trip entry and shared across all subpages.

**Tech Stack:** TanStack Start, TanStack DB, Electric SQL, React, Radix UI

---

## File Structure

### New Files

| File | Responsibility |
|------|----------------|
| `src/components/ui/PageSkeletons.tsx` | Page-specific loading skeletons for dashboard, leaderboard, rounds, scorecard, etc. |
| `src/components/trips/QuickActions.tsx` | Quick action buttons for trip dashboard (Add Round, Add Golfer, View Leaderboard) |
| `src/components/ui/Breadcrumbs.tsx` | Navigation breadcrumbs for deep pages |

### Modified Files

| File | Changes |
|------|---------|
| `src/db/trip-collections.ts` | Add priority tier configuration, export priority metadata |
| `src/contexts/TripDataContext.tsx` | Track sync status per priority tier, expose `isReady()` helper |
| `src/components/ui/Skeleton.tsx` | Add shimmer animation CSS |
| `src/routes/trips/$tripId/index.tsx` | Add loading state, quick actions, quick stats |
| `src/routes/trips/$tripId/leaderboards.tsx` | Add loading state, empty state |
| `src/routes/trips/$tripId/golfers.tsx` | Add loading state |
| `src/routes/trips/$tripId/rounds/index.tsx` | Add loading state, empty state |
| `src/routes/trips/$tripId/rounds/$roundId/scorecard.tsx` | Add loading state |
| `src/routes/trips/$tripId/challenges.tsx` | Add loading state, empty state |
| `src/routes/trips/$tripId/teams.tsx` | Add loading state |
| `src/components/SyncStatusIndicator.tsx` | Add syncing state with blue color |

---

## Task 1: Add Shimmer Animation to Skeleton Components

**Files:**
- Modify: `src/components/ui/Skeleton.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add shimmer keyframe animation to styles.css**

Add to `src/styles.css`:

```css
/* Skeleton shimmer animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--gray-3) 25%,
    var(--gray-4) 50%,
    var(--gray-3) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

- [ ] **Step 2: Verify animation works**

Open browser, inspect any skeleton element, verify the shimmer class animates.

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add shimmer animation for skeleton loading states"
```

---

## Task 2: Create Page-Specific Skeleton Components

**Files:**
- Create: `src/components/ui/PageSkeletons.tsx`

- [ ] **Step 1: Create PageSkeletons.tsx with all page skeletons**

```tsx
import { Card, Flex, Grid, Skeleton, Table } from '@radix-ui/themes'
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
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm check`
Expected: No errors in PageSkeletons.tsx

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add page-specific skeleton components for loading states"
```

---

## Task 3: Add Priority Tiers to Trip Collections

**Files:**
- Modify: `src/db/trip-collections.ts`

- [ ] **Step 1: Add priority tier type and metadata**

Add after the imports in `src/db/trip-collections.ts`:

```typescript
/**
 * Priority tiers for trip data loading
 * - critical: Blocks dashboard UI (tripGolfers, rounds, roundSummaries)
 * - high: Needed for most subpages (golfers, teams, challenges)
 * - normal: Large datasets loaded progressively (scores)
 */
export type PriorityTier = 'critical' | 'high' | 'normal'

export const COLLECTION_PRIORITIES: Record<keyof Omit<TripCollections, 'cleanup'>, PriorityTier> = {
  tripGolfers: 'critical',
  rounds: 'critical',
  roundSummaries: 'critical',
  golfers: 'high',
  teams: 'high',
  teamMembers: 'high',
  challenges: 'high',
  challengeResults: 'high',
  scores: 'normal',
  courses: 'high',
  holes: 'high',
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add priority tier metadata to trip collections"
```

---

## Task 4: Rewrite TripDataContext with Sync Status Tracking

**Files:**
- Modify: `src/contexts/TripDataContext.tsx`

- [ ] **Step 1: Rewrite TripDataContext with status tracking**

Replace the entire contents of `src/contexts/TripDataContext.tsx`:

```tsx
/**
 * Trip Data Context
 *
 * Provides trip-scoped Electric SQL collections with sync status tracking.
 *
 * Features:
 * - Priority-tiered loading (critical → high → normal)
 * - Sync status per tier for granular loading states
 * - Collections persist across trip subpage navigation
 * - Clean lifecycle management
 *
 * Usage:
 * ```tsx
 * const { collections, isReady, status } = useTripData()
 * if (!isReady('critical')) return <DashboardSkeleton />
 * ```
 */

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import {
  createTripCollections,
  COLLECTION_PRIORITIES,
  type TripCollections,
  type PriorityTier,
} from '../db/trip-collections'

type TierStatus = 'loading' | 'ready' | 'error'

interface SyncStatus {
  critical: TierStatus
  high: TierStatus
  normal: TierStatus
}

interface TripDataContextValue {
  tripId: string
  collections: TripCollections
  status: SyncStatus
  isReady: (tier: PriorityTier) => boolean
  isLoading: boolean
  error: Error | null
}

const TripDataContext = createContext<TripDataContextValue | null>(null)

interface TripDataProviderProps {
  tripId: string
  children: ReactNode
}

/**
 * Provider for trip-scoped collections with sync status
 */
export function TripDataProvider({ tripId, children }: TripDataProviderProps) {
  const [error, setError] = useState<Error | null>(null)

  // Create trip-scoped collections (memoized by tripId)
  const collections = useMemo(() => {
    try {
      return createTripCollections(tripId)
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to create collections'))
      return null
    }
  }, [tripId])

  // Track sync status by querying each collection
  // Critical tier: tripGolfers, rounds, roundSummaries
  const { data: tripGolfersData } = useLiveQuery(
    (q) => collections ? q.from({ tg: collections.tripGolfers }).select(({ tg }) => ({ id: tg.id })).limit(1) : null,
    [tripId, collections]
  )
  const { data: roundsData } = useLiveQuery(
    (q) => collections ? q.from({ r: collections.rounds }).select(({ r }) => ({ id: r.id })).limit(1) : null,
    [tripId, collections]
  )
  const { data: summariesData } = useLiveQuery(
    (q) => collections ? q.from({ s: collections.roundSummaries }).select(({ s }) => ({ id: s.id })).limit(1) : null,
    [tripId, collections]
  )

  // High tier: golfers, teams, teamMembers, challenges, challengeResults
  const { data: golfersData } = useLiveQuery(
    (q) => collections ? q.from({ g: collections.golfers }).select(({ g }) => ({ id: g.id })).limit(1) : null,
    [tripId, collections]
  )
  const { data: teamsData } = useLiveQuery(
    (q) => collections ? q.from({ t: collections.teams }).select(({ t }) => ({ id: t.id })).limit(1) : null,
    [tripId, collections]
  )

  // Normal tier: scores (large dataset)
  const { data: scoresData } = useLiveQuery(
    (q) => collections ? q.from({ s: collections.scores }).select(({ s }) => ({ id: s.id })).limit(1) : null,
    [tripId, collections]
  )

  // Determine tier status based on whether queries have returned
  // Note: Empty arrays mean "synced but no data" which is still ready
  const status: SyncStatus = useMemo(() => ({
    critical: tripGolfersData !== undefined && roundsData !== undefined && summariesData !== undefined
      ? 'ready'
      : 'loading',
    high: golfersData !== undefined && teamsData !== undefined
      ? 'ready'
      : 'loading',
    normal: scoresData !== undefined
      ? 'ready'
      : 'loading',
  }), [tripGolfersData, roundsData, summariesData, golfersData, teamsData, scoresData])

  const isReady = useCallback((tier: PriorityTier): boolean => {
    if (tier === 'critical') return status.critical === 'ready'
    if (tier === 'high') return status.critical === 'ready' && status.high === 'ready'
    return status.critical === 'ready' && status.high === 'ready' && status.normal === 'ready'
  }, [status])

  const isLoading = status.critical === 'loading'

  // Cleanup collections when unmounting or tripId changes
  useEffect(() => {
    return () => {
      collections?.cleanup()
    }
  }, [collections])

  if (!collections) {
    return null // Or error boundary
  }

  return (
    <TripDataContext.Provider
      value={{
        tripId,
        collections,
        status,
        isReady,
        isLoading,
        error,
      }}
    >
      {children}
    </TripDataContext.Provider>
  )
}

/**
 * Hook to access trip data context
 */
export function useTripData(): TripDataContextValue {
  const context = useContext(TripDataContext)
  if (!context) {
    throw new Error('useTripData must be used within TripDataProvider')
  }
  return context
}

/**
 * Hook to check if a specific tier is ready
 */
export function useTripDataReady(tier: PriorityTier): boolean {
  const { isReady } = useTripData()
  return isReady(tier)
}
```

- [ ] **Step 2: Verify file compiles**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: rewrite TripDataContext with sync status tracking per priority tier"
```

---

## Task 5: Add Loading State to Trip Dashboard

**Files:**
- Modify: `src/routes/trips/$tripId/index.tsx`

- [ ] **Step 1: Import skeleton and update component**

Add import at top of file:

```tsx
import { DashboardSkeleton } from '../../../components/ui/PageSkeletons'
import { useTripData } from '../../../contexts/TripDataContext'
```

- [ ] **Step 2: Add loading check at start of TripDashboard function**

Replace the beginning of `TripDashboard()` function (after the hooks) with:

```tsx
function TripDashboard() {
  const { tripId } = Route.useParams()
  const navigate = useNavigate()
  const { canManage } = useTripRole(tripId)
  const { isReady } = useTripData()

  // Show skeleton while critical data loads
  if (!isReady('critical')) {
    return (
      <Container size="2" py="6">
        <DashboardSkeleton />
      </Container>
    )
  }

  // ... rest of existing code
```

- [ ] **Step 3: Remove the old "Trip not found" early return**

The existing code has:
```tsx
if (!trip) {
  return (
    <Container size="2" py="6">
      <Text>Trip not found</Text>
    </Container>
  )
}
```

Keep this check but move it AFTER the loading check.

- [ ] **Step 4: Verify in browser**

1. Navigate to a trip
2. Should see skeleton immediately
3. Should see content once data loads

- [ ] **Step 5: Commit**

```bash
jj new -m "feat: add loading skeleton to trip dashboard"
```

---

## Task 6: Add Loading State to Leaderboards Page

**Files:**
- Modify: `src/routes/trips/$tripId/leaderboards.tsx`

- [ ] **Step 1: Add imports**

Add at top:

```tsx
import { LeaderboardSkeleton } from '../../../components/ui/PageSkeletons'
```

- [ ] **Step 2: Replace the roleLoading spinner with proper skeleton**

Find this code:

```tsx
if (roleLoading) {
  return (
    <Container size="2" py="6">
      <Flex justify="center" align="center" style={{ minHeight: '200px' }}>
        <Spinner size="3" />
      </Flex>
    </Container>
  )
}
```

Replace with:

```tsx
const { isReady } = useTripData()

// Show skeleton while data loads
if (!isReady('high') || roleLoading) {
  return (
    <Container size="2" py="6">
      <LeaderboardSkeleton />
    </Container>
  )
}
```

- [ ] **Step 3: Verify in browser**

Navigate to leaderboards, verify skeleton appears then content loads.

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add loading skeleton to leaderboards page"
```

---

## Task 7: Add Loading State to Golfers Page

**Files:**
- Modify: `src/routes/trips/$tripId/golfers.tsx`

- [ ] **Step 1: Read the current file**

Read the file to understand its structure.

- [ ] **Step 2: Add imports**

```tsx
import { GolfersSkeleton } from '../../../components/ui/PageSkeletons'
import { useTripData } from '../../../contexts/TripDataContext'
```

- [ ] **Step 3: Add loading check after hooks**

```tsx
const { isReady } = useTripData()

if (!isReady('high')) {
  return (
    <Container size="2" py="6">
      <GolfersSkeleton />
    </Container>
  )
}
```

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add loading skeleton to trip golfers page"
```

---

## Task 8: Add Loading State to Rounds List Page

**Files:**
- Modify: `src/routes/trips/$tripId/rounds/index.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { RoundsSkeleton } from '../../../../components/ui/PageSkeletons'
import { useTripData } from '../../../../contexts/TripDataContext'
```

- [ ] **Step 2: Add loading check**

```tsx
const { isReady } = useTripData()

if (!isReady('critical')) {
  return (
    <Container size="2" py="6">
      <RoundsSkeleton />
    </Container>
  )
}
```

- [ ] **Step 3: Add empty state**

Find where rounds are rendered and add empty state:

```tsx
{rounds && rounds.length === 0 && (
  <Card>
    <Flex direction="column" align="center" gap="3" py="6">
      <Text color="gray">No rounds yet. Add your first round to start tracking scores.</Text>
      <Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
        <Button>Add Round</Button>
      </Link>
    </Flex>
  </Card>
)}
```

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add loading skeleton and empty state to rounds list"
```

---

## Task 9: Add Loading State to Scorecard Page

**Files:**
- Modify: `src/routes/trips/$tripId/rounds/$roundId/scorecard.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { ScorecardSkeleton } from '../../../../../components/ui/PageSkeletons'
import { useTripData } from '../../../../../contexts/TripDataContext'
```

- [ ] **Step 2: Add loading check**

Scorecard needs scores which are 'normal' tier:

```tsx
const { isReady } = useTripData()

if (!isReady('normal')) {
  return (
    <Container size="2" py="6">
      <ScorecardSkeleton />
    </Container>
  )
}
```

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add loading skeleton to scorecard page"
```

---

## Task 10: Add Loading State to Challenges Page

**Files:**
- Modify: `src/routes/trips/$tripId/challenges.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { ChallengesSkeleton } from '../../../components/ui/PageSkeletons'
import { useTripData } from '../../../contexts/TripDataContext'
```

- [ ] **Step 2: Add loading check**

```tsx
const { isReady } = useTripData()

if (!isReady('high')) {
  return (
    <Container size="2" py="6">
      <ChallengesSkeleton />
    </Container>
  )
}
```

- [ ] **Step 3: Add empty state for no challenges**

Find where challenges are rendered and ensure empty state exists:

```tsx
{challenges && challenges.length === 0 && (
  <Card>
    <Flex direction="column" align="center" gap="3" py="6">
      <Text color="gray">No challenges yet. Create challenges like Closest to Pin or Longest Drive.</Text>
      <Button onClick={() => setAddDialogOpen(true)}>Add Challenge</Button>
    </Flex>
  </Card>
)}
```

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add loading skeleton and empty state to challenges page"
```

---

## Task 11: Add Loading State to Teams Page

**Files:**
- Modify: `src/routes/trips/$tripId/teams.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { TeamsSkeleton } from '../../../components/ui/PageSkeletons'
import { useTripData } from '../../../contexts/TripDataContext'
```

- [ ] **Step 2: Add loading check**

```tsx
const { isReady } = useTripData()

if (!isReady('high')) {
  return (
    <Container size="2" py="6">
      <TeamsSkeleton />
    </Container>
  )
}
```

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add loading skeleton to teams page"
```

---

## Task 12: Create QuickActions Component

**Files:**
- Create: `src/components/trips/QuickActions.tsx`

- [ ] **Step 1: Create QuickActions component**

```tsx
import { Link } from '@tanstack/react-router'
import { Flex, Button } from '@radix-ui/themes'
import { Plus, Users, Trophy } from 'lucide-react'

interface QuickActionsProps {
  tripId: string
  canManage: boolean
}

/**
 * Quick action buttons for trip dashboard
 */
export function QuickActions({ tripId, canManage }: QuickActionsProps) {
  return (
    <Flex gap="2" wrap="wrap">
      {canManage && (
        <Link to="/trips/$tripId/rounds/new" params={{ tripId }}>
          <Button variant="solid" size="2">
            <Plus size={16} />
            Add Round
          </Button>
        </Link>
      )}
      {canManage && (
        <Link to="/trips/$tripId/golfers" params={{ tripId }}>
          <Button variant="soft" size="2">
            <Users size={16} />
            Add Golfer
          </Button>
        </Link>
      )}
      <Link to="/trips/$tripId/leaderboards" params={{ tripId }}>
        <Button variant="soft" size="2">
          <Trophy size={16} />
          Leaderboard
        </Button>
      </Link>
    </Flex>
  )
}
```

- [ ] **Step 2: Commit**

```bash
jj new -m "feat: create QuickActions component for trip dashboard"
```

---

## Task 13: Add QuickActions to Trip Dashboard

**Files:**
- Modify: `src/routes/trips/$tripId/index.tsx`

- [ ] **Step 1: Import QuickActions**

```tsx
import { QuickActions } from '../../../components/trips/QuickActions'
```

- [ ] **Step 2: Add QuickActions after the header section**

Find the `{/* Stats */}` comment and add before it:

```tsx
{/* Quick Actions */}
<QuickActions tripId={tripId} canManage={canManage} />
```

- [ ] **Step 3: Verify in browser**

Navigate to trip dashboard, verify quick action buttons appear.

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add QuickActions to trip dashboard for better discoverability"
```

---

## Task 14: Create Breadcrumbs Component

**Files:**
- Create: `src/components/ui/Breadcrumbs.tsx`

- [ ] **Step 1: Create Breadcrumbs component**

```tsx
import { Link } from '@tanstack/react-router'
import { Flex, Text } from '@radix-ui/themes'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  to?: string
  params?: Record<string, string>
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

/**
 * Navigation breadcrumbs for deep pages
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <Flex align="center" gap="1" wrap="wrap">
      {items.map((item, index) => (
        <Flex key={index} align="center" gap="1">
          {index > 0 && <ChevronRight size={14} color="var(--gray-8)" />}
          {item.to ? (
            <Link to={item.to} params={item.params}>
              <Text size="2" color="blue" style={{ cursor: 'pointer' }}>
                {item.label}
              </Text>
            </Link>
          ) : (
            <Text size="2" color="gray">
              {item.label}
            </Text>
          )}
        </Flex>
      ))}
    </Flex>
  )
}
```

- [ ] **Step 2: Commit**

```bash
jj new -m "feat: create Breadcrumbs component for deep page navigation"
```

---

## Task 15: Add Syncing State to SyncStatusIndicator

**Files:**
- Modify: `src/components/SyncStatusIndicator.tsx`

- [ ] **Step 1: Add syncing state with blue color**

Find the status determination logic and add syncing state. Update the component:

```tsx
import { useLiveQuery } from '@tanstack/react-db'
import { Flex, Tooltip, Badge } from '@radix-ui/themes'
import { WifiOff, Cloud, AlertCircle, RefreshCw } from 'lucide-react'
import { syncStatusCollection, type SyncStatus } from '../db/sync-status'

export function SyncStatusIndicator() {
  const results = useLiveQuery((query) =>
    query.from({ syncStatus: syncStatusCollection })
  )

  const syncStatus: SyncStatus | undefined = results?.data?.[0]

  if (!syncStatus) return null

  const { isOnline, pendingCount, lastSyncError, isSyncing } = syncStatus

  // Determine status color and icon
  let statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray' = 'gray'
  let StatusIcon = Cloud

  if (!isOnline) {
    statusColor = 'yellow'
    StatusIcon = WifiOff
  } else if (lastSyncError) {
    statusColor = 'red'
    StatusIcon = AlertCircle
  } else if (isSyncing || pendingCount > 0) {
    statusColor = 'blue'
    StatusIcon = RefreshCw
  } else {
    statusColor = 'green'
    StatusIcon = Cloud
  }

  // Build tooltip content
  let tooltipContent = isOnline ? 'Online' : 'Offline'
  if (isSyncing) {
    tooltipContent = 'Syncing...'
  }
  if (pendingCount > 0) {
    tooltipContent += ` - ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}`
  }
  if (lastSyncError) {
    tooltipContent += ` - Error: ${lastSyncError}`
  }
  if (!isSyncing && !pendingCount && !lastSyncError && isOnline) {
    tooltipContent = 'All changes saved'
  }

  return (
    <Tooltip content={tooltipContent}>
      <Flex align="center" gap="1" style={{ cursor: 'help' }}>
        <StatusIcon
          size={16}
          style={{
            color: `var(--${statusColor}-9)`,
            animation: isSyncing ? 'spin 1s linear infinite' : undefined,
          }}
        />
        {pendingCount > 0 && (
          <Badge size="1" color={statusColor} variant="soft">
            {pendingCount}
          </Badge>
        )}
      </Flex>
    </Tooltip>
  )
}
```

- [ ] **Step 2: Add spin animation to styles.css**

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 3: Update sync-status.ts to include isSyncing field**

In `src/db/sync-status.ts`, add `isSyncing: boolean` to the SyncStatus type if not present.

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add syncing state with blue color to SyncStatusIndicator"
```

---

## Task 16: Manual Testing

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Test loading states**

1. Clear browser cache/local storage
2. Navigate to a trip
3. Verify: Skeleton appears immediately, then content loads
4. Click Leaderboard: Skeleton appears, then content
5. Click Rounds: Skeleton appears, then content
6. Click into a scorecard: Skeleton appears, then content

- [ ] **Step 3: Test quick actions**

1. On trip dashboard, verify "Add Round", "Add Golfer", "Leaderboard" buttons visible
2. Click "Add Round" - should navigate to new round form

- [ ] **Step 4: Test offline**

1. Load a trip fully
2. Open DevTools, go to Network tab, set to Offline
3. Navigate between trip pages - should still work (data cached)
4. Enter a score - should work (queued locally)
5. Go back online - verify sync indicator shows syncing

- [ ] **Step 5: Test memory**

1. Open DevTools Memory tab
2. Take heap snapshot
3. Navigate between 3 different trips
4. Take another snapshot
5. Compare - memory should be stable (no growth per trip)

- [ ] **Step 6: Document any issues**

If issues found, create follow-up tasks.

- [ ] **Step 7: Commit any final fixes**

```bash
jj new -m "fix: address issues found during manual testing"
```

---

## Task 17: Final Cleanup and Documentation

- [ ] **Step 1: Update tasks/todo.md**

Add a "Completed" section for this optimization work:

```markdown
### Session 2026-04-05: Performance Optimization

- [x] Add shimmer animation to skeletons
- [x] Create page-specific skeleton components
- [x] Add priority tiers to trip collections
- [x] Rewrite TripDataContext with sync status tracking
- [x] Add loading states to all trip pages
- [x] Create QuickActions component
- [x] Create Breadcrumbs component
- [x] Enhance SyncStatusIndicator with syncing state
- [x] Manual testing and verification
```

- [ ] **Step 2: Update lessons.md if any new patterns discovered**

- [ ] **Step 3: Final commit**

```bash
jj new -m "docs: update todo.md with performance optimization completion"
```

---

## Success Criteria Checklist

- [ ] Trip subpage navigation < 100ms after initial trip load
- [ ] Loading skeleton appears < 50ms on any route transition
- [ ] No blank screens during any navigation
- [ ] Offline score entry works after trip data is loaded
- [ ] "Add Round" is discoverable from trip dashboard
- [ ] Memory stable when switching between trips
