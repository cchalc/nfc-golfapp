# Performance Optimization Design

**Date**: 2026-04-05
**Status**: Approved
**Goal**: Make the Golf Trip Planner app blazing fast with instant navigation and offline-first capability

## Problem Statement

The app experiences significant lag (2-3+ seconds) on every route transition. The URL changes but nothing renders—not even a loading indicator. Once data loads, interactions are fine. This makes the app unusable for its intended purpose: tracking scores during golf rounds, often in areas with poor connectivity.

### Observed Symptoms

| Transition | Behavior |
|------------|----------|
| Trip list → Trip dashboard | Slow (2-3s) |
| Trip dashboard → Golfers | Slow |
| Golfers → Individual golfer | Slow |
| Trip dashboard → Rounds | Slow |
| Round → Scorecard | Slow |
| Back navigation | Still slow |
| Creating new trip | Lag before redirect |

### Root Cause

Each route independently creates Electric SQL shape subscriptions. Each shape takes 500ms+ to establish (Electric Cloud latency + Neon cold start). Routes wait for data before rendering, with no loading feedback.

## Solution Overview

**Approach**: Eager Trip Preloading + Loading States

1. **Loading states**: Every route renders immediately with skeleton UI
2. **Parallel preloading**: When entering a trip, load ALL trip data at once
3. **Shared collections**: Trip-scoped collections persist across all trip subpages
4. **Offline-first**: Preloaded data works without connection; mutations queue and sync later

### Expected Impact

| Metric | Current | Target |
|--------|---------|--------|
| Trip subpage navigation | 2-3s | <100ms |
| Initial trip load | 3-5s | 1-2s (with loading feedback) |
| Perceived responsiveness | Poor (frozen UI) | Good (immediate skeleton) |
| Offline capability | Partial | Full (after initial load) |

---

## Design Details

### 1. Loading States Architecture

Every route renders immediately with a loading skeleton, then swaps in real content when data arrives.

**Flow**:
```
Route Transition
    ↓
Render skeleton immediately (< 16ms)
    ↓
TripDataContext checks sync status
    ↓
[Syncing] → Show skeleton + subtle progress indicator
[Synced] → Render actual content
[Error] → Show error state with retry
```

**Loading states by page**:

| Page | Loading State |
|------|---------------|
| Trip Dashboard | Skeleton cards for stats, empty rounds list |
| Leaderboard | Table skeleton with shimmer rows |
| Golfers | Grid of golfer card skeletons |
| Rounds | List of round card skeletons |
| Scorecard | Grid skeleton for 18 holes |
| Challenges | Challenge card skeletons |

**Implementation**:
- `TripDataContext` exposes: `{ isLoading, isReady, error, status }`
- Each page checks status and renders skeleton or content accordingly
- Extend existing `src/components/ui/Skeleton.tsx` with page-specific variants

### 2. Trip Preloading Strategy

When user enters any `/trips/$tripId/*` route, preload all trip data in parallel.

**Preload priorities**:

| Priority | Collections | Sync Mode | Blocks UI |
|----------|-------------|-----------|-----------|
| **Critical** | tripGolfers, rounds, roundSummaries | immediate | Yes |
| **High** | golfers, teams, teamMembers, challenges, challengeResults | immediate | No |
| **Normal** | scores | progressive | No |
| **On-demand** | courses, holes, teeBoxes | on-demand | No |

**Status tracking**:
```typescript
type PreloadStatus = {
  critical: 'loading' | 'ready' | 'error'
  high: 'loading' | 'ready' | 'error'
  normal: 'loading' | 'ready' | 'error'
}
```

**Route requirements**:

| Route | Waits For |
|-------|-----------|
| Dashboard | critical |
| Leaderboard | critical + high |
| Golfers | critical + high |
| Rounds List | critical |
| Scorecard | critical + high + normal |
| Challenges | critical + high |
| Teams | critical + high |

**Course data**: Loaded on-demand when viewing a round, cached globally (courses are shared across trips).

### 3. Collection Lifecycle Management

Collections persist for the entire trip session, shared across all trip subpages.

**Lifecycle**:
```
/trips/$tripId (layout mounts)
    ↓
TripDataProvider creates 11 trip-scoped collections
    ↓
All child routes share same collections via useTripData()
    ↓
User navigates within trip → collections reused (instant)
    ↓
User leaves trip → collections disposed, connections closed
```

**Collection identity**: Keyed by tripId to ensure:
- Same trip = reuse collections (no refetch)
- Different trip = new collections (fresh data)

**Memory management**:

| Event | Action |
|-------|--------|
| Enter trip | Create collections, start sync |
| Navigate within trip | Reuse collections |
| Leave trip | Dispose collections, clear memory |
| Switch to different trip | Dispose old, create new |

**Cleanup**:
```typescript
useEffect(() => {
  const collections = createTripCollections(tripId)
  return () => {
    collections.forEach(col => col.dispose?.())
  }
}, [tripId])
```

### 4. Offline-First Guarantees

Preloaded data works completely offline. Mutations queue locally and sync on reconnection.

**Offline capabilities**:

| Action | Offline Behavior |
|--------|------------------|
| View leaderboard | Works (data preloaded) |
| View scorecard | Works (data preloaded) |
| Enter/edit scores | Works (queued locally) |
| Create challenge | Works (queued locally) |
| Add golfer to trip | Works (queued locally) |
| Create new trip | Works locally, syncs later |
| Search courses (API) | Requires connection |

**Data flow (offline)**:
```
User enters score
    ↓
TanStack DB (optimistic update) → UI updates instantly
    ↓
Mutation queued in IndexedDB
    ↓
[Connection restored]
    ↓
Queue replays → Server mutations execute
    ↓
Electric syncs → reconciles
```

**Sync status indicator states**:

| State | Icon | Color | Tooltip |
|-------|------|-------|---------|
| Synced | Cloud ✓ | Green | "All changes saved" |
| Syncing | Cloud ↻ | Blue | "Syncing 3 changes..." |
| Offline | Cloud ✗ | Yellow | "Offline - changes saved locally" |
| Pending | Cloud + badge | Yellow | "5 changes waiting to sync" |
| Error | Cloud ! | Red | "Sync error - tap to retry" |

**Conflict resolution**: Electric SQL last-write-wins at row level. Unlikely issue since each person enters their own scores.

### 5. Data Flow Architecture

**Optimized architecture**:
```
/trips/$tripId (layout mounts)
    │
    ├── TripDataProvider
    │   ├── Creates collections ONCE
    │   ├── Starts parallel preload (11 shapes)
    │   ├── Tracks sync status per priority tier
    │   └── Exposes: { collections, status, isReady }
    │
    ▼
┌─────────────────────────────────────────────┐
│  TripDataContext (shared across all routes) │
│                                             │
│  collections: {                             │
│    tripGolfers, golfers, rounds,            │
│    roundSummaries, scores, teams,           │
│    teamMembers, challenges, challengeResults│
│  }                                          │
│                                             │
│  status: { critical, high, normal }         │
└─────────────────────────────────────────────┘
    │
    ├── /leaderboards → useTripData() → instant
    ├── /rounds → useTripData() → instant
    ├── /golfers → useTripData() → instant
    └── /scorecard → useTripData() → instant
```

**Connection management**:
- 11 persistent SSE connections (one per trip-scoped shape)
- Established once on trip entry
- Kept alive for entire trip session
- Disposed on trip exit

**Global collections** (unchanged, loaded on-demand):
- courses, teeBoxes, holes (loaded when viewing round details)
- identities, tripOrganizers, tripInvites (auth, loaded at app start)

### 6. UX Fixes

**Add Rounds discoverability**:
- Add "Quick Actions" section to trip dashboard with prominent [+ Add Round] button
- Also include [+ Add Golfer] and [View Leaderboard]

**Empty states**:

| Page | Empty State |
|------|-------------|
| Rounds list | "No rounds yet. Add your first round to start tracking scores." + [Add Round] |
| Leaderboard | "No scores recorded yet. Add a round and enter scores to see the leaderboard." |
| Challenges | "No challenges yet. Create challenges like Closest to Pin or Longest Drive." + [Add Challenge] |

**Breadcrumb navigation** (deep pages):
```
Myrtle Beach Trip > Round 1: Gallagher's Canyon > Scorecard
[Trip] ← clickable    [Round] ← clickable
```

**Loading feedback during actions**:
- Button shows spinner + "Creating..." during mutations
- Success → Navigate to new entity
- Error → Show inline error, preserve form data

**Trip dashboard quick stats**:
```
┌─────────────────────────────────────────┐
│ Myrtle Beach Trip 2026                  │
│ Mar 15-18 • 8 golfers • 3 rounds        │
├─────────────────────────────────────────┤
│ Current Leader: John S. (42 pts)        │
│ Next Round: Tomorrow, Cabot Links       │
└─────────────────────────────────────────┘
```

---

## Files to Modify/Create

### New Files

| File | Purpose |
|------|---------|
| `src/components/ui/PageSkeletons.tsx` | Page-specific loading skeletons |
| `src/components/trips/QuickActions.tsx` | Dashboard quick action buttons |
| `src/components/ui/Breadcrumbs.tsx` | Navigation breadcrumbs |

### Modified Files (Major Rewrites)

| File | Changes |
|------|---------|
| `src/contexts/TripDataContext.tsx` | Rewrite with preloading, priority tiers, status tracking |
| `src/db/trip-collections.ts` | Add priority tiers, sync mode config |
| `src/routes/trips/$tripId.tsx` | Wrap with optimized TripDataProvider |
| `src/routes/trips/$tripId/index.tsx` | Add quick actions, quick stats, loading state |
| `src/routes/trips/$tripId/leaderboards.tsx` | Add loading state, empty state |
| `src/routes/trips/$tripId/golfers.tsx` | Add loading state |
| `src/routes/trips/$tripId/rounds/index.tsx` | Add loading state, empty state |
| `src/routes/trips/$tripId/rounds/$roundId/scorecard.tsx` | Add loading state |
| `src/routes/trips/$tripId/challenges.tsx` | Add loading state, empty state |
| `src/routes/trips/$tripId/teams.tsx` | Add loading state |
| `src/components/SyncStatusIndicator.tsx` | Enhanced states |

---

## Success Criteria

1. **Trip subpage navigation < 100ms** after initial trip load
2. **Loading skeleton appears < 50ms** on any route transition
3. **No blank screens** during any navigation
4. **Offline score entry works** after trip data is loaded
5. **"Add Round" is discoverable** from trip dashboard
6. **Memory stable** when switching between trips

---

## Out of Scope

- Self-hosting Electric SQL (future infrastructure optimization)
- Row-level security in PostgreSQL (Phase 7.4)
- Multi-user concurrent editing (Phase 7.5)
- Course search API caching (works online only)

---

## Testing Strategy

1. **Manual testing**: Navigate all trip routes, verify loading states appear
2. **Network throttling**: Slow 3G in DevTools, verify UX remains responsive
3. **Offline testing**: Airplane mode after trip load, verify score entry works
4. **Memory profiling**: Switch trips 10x, verify memory doesn't grow
5. **Performance budgets**: Use existing `src/lib/performance.ts` to measure

---

## References

- Existing optimization work: `tasks/todo.md` (Phases 1-3)
- Lessons learned: `tasks/lessons.md`
- Performance testing guide: `TESTING_PERFORMANCE.md`
- Current trip collections: `src/db/trip-collections.ts`
- Current context: `src/contexts/TripDataContext.tsx`
