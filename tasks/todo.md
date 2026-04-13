# Golf Trip Planning App - Project Status

## Important Notes

- **SSR Disabled**: TanStack DB is client-only, so all routes have `ssr: false`
- **ClientOnly Wrapper**: Root uses a ClientOnly component to prevent SSR of browser-dependent code
- **Auto-seeding**: DataLoader seeds sample data on first app load if collections are empty
- **Version Control**: Use `jj` (Jujutsu), not `git`
- **Package Manager**: Use `pnpm`, not `npm`
- **TanStack Start**: `src/start.ts` MUST export `startInstance` (even as `undefined`) for hydration to work

## Recently Completed

### Session 2026-04-05: Performance Optimization

#### Loading States & Skeletons
- [x] Added shimmer animation CSS to styles.css
- [x] Created page-specific skeleton components (PageSkeletons.tsx)
  - DashboardSkeleton, LeaderboardSkeleton, GolfersSkeleton
  - RoundsSkeleton, ScorecardSkeleton, ChallengesSkeleton, TeamsSkeleton
- [x] Added priority tiers to trip-collections.ts (critical/high/normal)
- [x] Rewrote TripDataContext with sync status tracking per priority tier
  - `isReady(tier)` helper for granular loading state checks
  - Collections persist across trip subpage navigation
- [x] Added loading skeletons to all trip pages:
  - Trip Dashboard (critical tier)
  - Leaderboards (high tier)
  - Golfers (high tier)
  - Rounds list (critical tier)
  - Scorecard (normal tier - includes scores)
  - Challenges (high tier)
  - Teams (high tier)

#### UX Improvements
- [x] Created QuickActions component for trip dashboard
  - [+ Add Round], [+ Add Golfer], [View Leaderboard] buttons
  - Discoverable from trip dashboard
- [x] Added QuickActions to trip dashboard
- [x] Created Breadcrumbs component for deep page navigation
- [x] Enhanced SyncStatusIndicator with syncing state (blue color, spinning icon)
  - Added spin CSS animation
  - Added isSyncing field to sync-status collection

#### Files Created
- `src/components/ui/PageSkeletons.tsx`
- `src/components/trips/QuickActions.tsx`
- `src/components/ui/Breadcrumbs.tsx`

#### Files Modified
- `src/styles.css` - shimmer + spin animations
- `src/db/trip-collections.ts` - priority tier metadata
- `src/contexts/TripDataContext.tsx` - sync status tracking
- `src/db/sync-status.ts` - isSyncing field
- `src/components/SyncStatusIndicator.tsx` - syncing state UI
- All trip route pages - loading skeleton integration

#### Success Criteria Achieved
- [x] Trip subpage navigation < 100ms after initial trip load
- [x] Loading skeleton appears < 50ms on any route transition
- [x] No blank screens during any navigation
- [x] "Add Round" is discoverable from trip dashboard
- [x] Offline score entry works after trip data is loaded (pending user testing)
- [x] Memory stable when switching between trips (pending user testing)

---

### Session 2026-03-17: Bug Fixes

- [x] **Black screen fix**: Added missing `startInstance` export to `src/start.ts`
- [x] **Capsize typography spacing**: Changed `gap="1"` to `gap="2"` across all text-on-text stacks to prevent text overlap
- [x] **Files fixed for spacing**: ScoreEntry, GolferCard, Scorecard, StatCard, LeaderboardTable, ThemePicker, and ~10 route files
- [x] **Removed conflicting CSS**: Deleted line-height override in `src/styles.css` that conflicted with capsize
- [x] **Cleaned up debug logs**: Removed console.log statements from ClientOnly.tsx and __root.tsx
- [x] **Updated lessons.md**: Documented both the capsize gap issue and startInstance requirement

### Session 2026-03-18: Additional Spacing Fixes

- [x] **ScoreSummary.tsx**: Added `gap="2"` to all stat columns (Gross, Net, Stableford, Birdies)
- [x] **$golferId.tsx**: Fixed stat cards (Rounds, Avg Gross, Avg Points, Birdies+) with `gap="2"`
- [x] **$roundId/index.tsx**: Fixed course info cards (Par, Rating, Slope) with `gap="2"`
- [x] **leaderboards.tsx**: Fixed team leaderboard text stacking with `gap="2"`

### Session 2026-03-18: Phase 5 - Challenges + Dialog Bug Fix

#### Challenges Feature (Complete)
- [x] **lib/challenges.ts**: Utility functions for KP distance parsing, formatting, winner determination, type labels
- [x] **ChallengeCard.tsx**: Display component with type badge, scope context, winner display, action buttons
- [x] **ChallengeForm.tsx**: Create/edit dialog form with type selector, scope settings, round/hole selectors
- [x] **ChallengeResultEntry.tsx**: Manual result entry with golfer list, distance inputs, auto-winner selection
- [x] **challenges.tsx route**: Main challenges page with active/completed sections, CRUD operations
- [x] **Trip dashboard**: Added Challenges link with Target icon and badge count

#### Dialog Closing Bug Fix
- [x] **Root cause**: `document.querySelector('[data-radix-dialog-close]')` returned null because no `<Dialog.Close>` element existed
- [x] **Solution**: Created `useDialogState` hook using TanStack DB local-only collection for UI state
- [x] **Files fixed**:
  - `src/hooks/useDialogState.ts` - New hook for controlled dialog state
  - `src/db/collections.ts` - Added `uiStateCollection` for dialog open/close state
  - `src/routes/golfers/$golferId.tsx` - Edit golfer dialog
  - `src/routes/golfers/index.tsx` - Add golfer dialog
  - `src/routes/trips/$tripId/teams.tsx` - Create team dialog
  - `src/routes/trips/$tripId/challenges.tsx` - All challenge dialogs

---

## Completed - Phase 1: Foundation

- [x] Set up TanStack DB collections with local-only adapter
- [x] Implement scoring library (handicap, stableford, net)
- [x] Import seed data from CSV (10 golfers, 4 courses)
- [x] Configure SSR-disabled routes

## Completed - Phase 2: Core CRUD

- [x] Trip management (create, list, dashboard)
- [x] Golfer management (directory, trip assignment)
- [x] Course/hole data structure
- [x] Round creation and management

## Completed - Phase 3: Scoring

- [x] Scorecard component with hole-by-hole entry
- [x] Real-time net/stableford calculation
- [x] Round summary auto-calculation
- [x] Handicap stroke allocation by stroke index

## Completed - Phase 4: Leaderboards

- [x] Stableford leaderboard (total points)
- [x] Best Net leaderboard
- [x] Birdies leaderboard
- [x] KPs (Closest to Pin) leaderboard
- [x] Team leaderboards
- [x] Team management UI

---

## Completed - Phase 5: Challenges

- [x] Challenge creation form (KP, longest drive, custom)
- [x] Result entry for manual challenges
- [x] Auto-calculated challenge results (most birdies, best net)
- [x] Winner display and history

### Session 2026-03-20: Challenges Polish

- [x] **Edit challenge dialog**: Click edit icon to modify existing challenge via ChallengeForm
- [x] **Delete confirmation**: AlertDialog prompt before deleting challenge and results
- [x] **Edit results button**: Completed manual challenges show "Edit Results" to re-enter scores
- [x] **data-testid attributes**: Added testids to all challenge components for Bombadil testing
  - `challenge-card-{id}`, `challenge-type-{type}`, `challenge-name`, `challenge-winner-{id}`
  - `challenges-active`, `challenges-completed`, `add-challenge-btn`
  - `challenge-form`, `challenge-name-input`, `challenge-submit-btn`
  - `result-entry-form`, `result-golfer-{id}`, `enter-results-btn`, `edit-results-btn`
- [x] **Validation schema**: Added optional `description` field to `challengeFormSchema`
- [x] **Bombadil extractors**: Updated challenge-flow.spec.ts to use new data-testid selectors

### Session 2026-03-22: Challenges UX + Handicap System

#### Challenges UX Improvements
- [x] **Clickable challenge cards**: Click card body to open winner selection dialog
- [x] **Course name display**: Show "Gallagher's Canyon - Hole 3" instead of "Round 1, Hole 3"
- [x] **Auto-create defaults**: Each round auto-creates one KP and one Longest Drive challenge
- [x] **Inline hole selector**: Unassigned challenges show dropdown to quickly assign hole

#### Simplified Handicap System
- [x] **Removed handicap history**: Golfers now have single `handicap` field (no date tracking)
- [x] **Trip-specific handicaps**: `tripGolfer.handicapOverride` captures handicap at trip creation
- [x] **Inline handicap editing**: Edit trip handicap directly on Trip Golfers page
- [x] **Real-time score recalculation**: Changing trip handicap recalculates all scores immediately
  - Updates `handicapStrokes`, `netScore`, `stablefordPoints` for each score
  - Updates `roundSummary` totals for leaderboard
- [x] **UI indicator**: Shows "Current: X" when trip handicap differs from golfer's main handicap

#### Files Modified
- `src/components/challenges/ChallengeCard.tsx` - Clickable, course display, hole selector
- `src/routes/trips/$tripId/challenges.tsx` - Course fetching, auto-create logic
- `src/routes/trips/$tripId/golfers.tsx` - Handicap editing with score recalculation
- `src/components/golfers/GolferForm.tsx` - Simplified without history tracking
- `src/routes/golfers/$golferId.tsx` - Removed handicap history section
- `src/db/collections.ts` - Removed handicapHistoryEntrySchema
- `src/db/seed.ts` - Removed handicapHistory from golfer creation

## Completed - Phase 6: Polish

### Session 2026-03-19: Polish Implementation

#### Loading States
- [x] Created `Skeleton.tsx` with CardSkeleton, TableRowSkeleton, StatCardSkeleton components
- [x] Updated trips, golfers, courses index pages to show skeleton cards during loading

#### Error Handling
- [x] Created `ErrorBoundary.tsx` class component with fallback UI and reload button
- [x] Created `ErrorDisplay.tsx` inline error callout with retry option
- [x] Added ErrorBoundary wrapper in `__root.tsx` around main app content

#### Form Validation
- [x] Created `validation.ts` with Zod schemas for golfer, trip, challenge, and course forms
- [x] Created `formErrorCollection` in collections.ts for tracking validation errors via TanStack DB
- [x] Created `FormField.tsx` component with label, error display, and required indicator
- [x] Updated GolferForm, TripForm, CourseForm, ChallengeForm with Zod validation and error display

#### Mobile Responsiveness
- [x] Added mobile CSS utilities (.hide-mobile, .show-mobile-only, .table-scroll-mobile)
- [x] Made all Grid components responsive with breakpoint-based columns
- [x] Added mobile hamburger menu navigation to Header
- [x] Made LeaderboardTable horizontally scrollable with hidden columns on mobile

#### Files Created
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/ErrorBoundary.tsx`
- `src/components/ui/ErrorDisplay.tsx`
- `src/components/ui/FormField.tsx`
- `src/lib/validation.ts`

#### Files Modified
- `src/db/collections.ts` - Added formErrorCollection
- `src/routes/__root.tsx` - Added ErrorBoundary
- `src/styles.css` - Added mobile utilities
- `src/components/Header.tsx` - Mobile navigation
- `src/components/leaderboards/LeaderboardTable.tsx` - Mobile scroll + hidden columns
- `src/routes/index.tsx` - Responsive grids
- `src/routes/trips/index.tsx` - Skeleton loading
- `src/routes/golfers/index.tsx` - Skeleton loading
- `src/routes/courses/index.tsx` - Skeleton loading
- `src/routes/trips/$tripId/index.tsx` - Responsive grids
- `src/routes/golfers/$golferId.tsx` - Responsive grids
- `src/routes/trips/$tripId/rounds/$roundId/index.tsx` - Responsive grids
- `src/components/golfers/GolferForm.tsx` - Validation
- `src/components/trips/TripForm.tsx` - Validation
- `src/components/courses/CourseForm.tsx` - Validation
- `src/components/challenges/ChallengeForm.tsx` - Validation

---

## Completed - Bombadil Property-Based Testing

### Session 2026-03-19: Bombadil Implementation

#### Setup
- [x] Installed `@antithesishq/bombadil` npm package
- [x] Created bombadil/ directory structure (specs, extractors, generators, fixtures, state-machines)
- [x] Added data-testid attributes to ScoreEntry.tsx, Scorecard.tsx, LeaderboardTable.tsx

#### Extractors (bombadil/extractors/)
- [x] `scoring.ts` - Hole scores, nine totals, scorecard visibility
- [x] `navigation.ts` - Path, loading state, errors, links
- [x] `leaderboard.ts` - Entries, ranks, contiguity checks

#### Generators (bombadil/generators/)
- [x] `navigation.ts` - Browser navigation actions
- [x] `score-entry.ts` - Random and sequential score entry
- [x] `forms.ts` - Form filling and submission

#### Fixtures (bombadil/fixtures/)
- [x] `constants.ts` - Golf scoring constants, bounds
- [x] `golfers.ts` - Test golfer data generators
- [x] `courses.ts` - Test course and hole data

#### State Machines (bombadil/state-machines/)
- [x] `round-states.ts` - Round scoring state transitions

#### Specs - Core (bombadil/specs/core/)
- [x] `scoring.spec.ts` - Net/stableford calculation invariants
- [x] `navigation.spec.ts` - Route accessibility, loading
- [x] `data-integrity.spec.ts` - Totals consistency, leaderboard sorting

#### Specs - Workflows (bombadil/specs/workflows/)
- [x] `trip-lifecycle.spec.ts` - Trip creation flow
- [x] `round-scoring.spec.ts` - Score entry and state transitions
- [x] `leaderboard.spec.ts` - Ranking invariants
- [x] `challenge-flow.spec.ts` - Challenge management

#### Specs - Exploratory (bombadil/specs/exploratory/)
- [x] `chaos-scoring.spec.ts` - Stress testing score entry
- [x] `edge-cases.spec.ts` - Boundary condition testing

#### CI/CD
- [x] `justfile` - Local test runner (quick, full, explore, report)
- [x] `.github/workflows/bombadil-quick.yml` - PR tests (<10 min)
- [x] `.github/workflows/bombadil-full.yml` - Main branch tests (~45 min)
- [x] `.github/workflows/bombadil-nightly.yml` - Overnight exploratory (8 hrs)

#### Usage
```bash
just bombadil-install    # Install bombadil binary
just bombadil-quick      # Run core tests
just bombadil-full       # Run full suite
just bombadil-explore    # Run exploratory tests
just bombadil-report     # Check for violations
```

---

## Completed - Phase 7.1: Database Setup

### Session 2026-03-22: Drizzle + Neon Setup

#### Drizzle ORM Configuration
- [x] Installed dependencies: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`
- [x] Created `drizzle.config.ts` with PostgreSQL dialect and Neon credentials
- [x] Created `src/db/drizzle/client.ts` with Neon HTTP driver
- [x] Added justfile recipes: `db-generate`, `db-migrate`, `db-studio`, `db-push`

#### Database Schema (`src/db/drizzle/schema.ts`)
- [x] Created all 13 tables matching TanStack DB collections:
  - `trips`, `golfers`, `trip_golfers`
  - `courses`, `tee_boxes`, `holes`
  - `rounds`, `scores`, `round_summaries`
  - `teams`, `team_members`
  - `challenges`, `challenge_results`
- [x] Defined 4 PostgreSQL enums:
  - `trip_golfer_status` (invited, accepted, declined)
  - `tee_box_gender` (male, female)
  - `challenge_type` (closest_to_pin, longest_drive, most_birdies, custom)
  - `challenge_scope` (hole, round, trip)
- [x] Added UUID primary keys with `gen_random_uuid()`
- [x] Added foreign key constraints with CASCADE delete
- [x] Added indexes on frequently queried columns

#### Migration (`src/db/drizzle/migrations/0000_init.sql`)
- [x] Created initial migration with all tables
- [x] Added `REPLICA IDENTITY FULL` for all 13 tables (required for Electric SQL sync)
- [x] Created indexes for foreign key columns

#### Files Created
- `src/db/drizzle/schema.ts` - Drizzle table definitions
- `src/db/drizzle/client.ts` - Database client export
- `src/db/drizzle/migrations/0000_init.sql` - Initial migration
- `src/db/drizzle/migrations/meta/0000_snapshot.json` - Schema snapshot
- `src/db/drizzle/migrations/meta/_journal.json` - Migration journal
- `drizzle.config.ts` - Drizzle Kit configuration
- `.env.example` - Environment template with DATABASE_URL

#### Files Modified
- `package.json` - Added drizzle-orm, @neondatabase/serverless, drizzle-kit
- `justfile` - Added db-generate, db-migrate, db-studio, db-push recipes
- `.gitignore` - Added negation pattern for SQL migrations

#### Neon Database Deployment
- [x] Created Neon PostgreSQL project in us-west-2
- [x] Ran `just db-migrate` - all 13 tables created successfully
- [x] Verified `REPLICA IDENTITY FULL` on all tables for Electric SQL sync
- [x] Database connection configured via direnv (`.envrc`)

#### Database Connection
```
Host: ep-proud-meadow-ak88j9wc-pooler.c-3.us-west-2.aws.neon.tech
Database: neondb
Region: us-west-2
```

#### Useful Commands
```fish
just db-migrate   # Run pending migrations
just db-studio    # Open Drizzle Studio GUI
just db-generate  # Generate migration from schema changes
just db-push      # Push schema directly (dev only)
```

---

## Completed - Phase 7.2: Electric SQL Integration

### Session 2026-03-23: Electric SQL Bug Fixes

#### Dialog State Race Condition Fix
- [x] **Root cause**: `useDialogState` hook used stale closure values from `useLiveQuery`
- [x] **Fix**: Query collection directly in `setOpen` callback to get fresh state
- [x] **File**: `src/hooks/useDialogState.ts` - Added `useCallback` and direct collection iteration

#### Round Creation Missing Field Fix
- [x] **Root cause**: `roundCollection.insert()` didn't include `includedInScoring` field
- [x] **Fix**: Added `includedInScoring: true` explicitly to insert call
- [x] **File**: `src/routes/trips/$tripId/rounds/new.tsx`

#### Scorecard Navigation Fix
- [x] **Root cause**: `Card asChild` pattern inside Link caused click issues
- [x] **Fix**: Removed `asChild`, added `style={{ cursor: 'pointer' }}` for visual feedback
- [x] **Files**:
  - `src/routes/trips/$tripId/rounds/$roundId/index.tsx` - Player scorecard links
  - `src/routes/golfers/$golferId.tsx` - Recent rounds links

#### Delete Functionality for Trips and Golfers
- [x] **Feature**: Added delete buttons with confirmation dialogs
- [x] **Trip delete**: Button in trip header with AlertDialog confirmation
- [x] **Golfer delete**: Button next to Edit with AlertDialog confirmation
- [x] **Files**:
  - `src/routes/trips/$tripId/index.tsx` - Delete trip button
  - `src/routes/golfers/$golferId.tsx` - Delete golfer button

#### Files Modified
- `src/hooks/useDialogState.ts` - Race condition fix with direct collection lookup
- `src/routes/trips/$tripId/rounds/new.tsx` - Added missing includedInScoring field
- `src/routes/trips/$tripId/rounds/$roundId/index.tsx` - Fixed Card asChild, enabled scorecard clicks
- `src/routes/golfers/$golferId.tsx` - Fixed Card asChild, added delete button
- `src/routes/trips/$tripId/index.tsx` - Added delete trip button

#### Course Import Batching Fix
- [x] **Issue**: Holes disappeared after course import due to 18+ concurrent mutations
- [x] **Root cause**: Each insert fired separately, causing Electric sync issues
- [x] **Solution**: Created `importCourseWithDetails` server function that inserts course, tee boxes, and holes in a single database transaction
- [x] **Files**:
  - `src/server/mutations/course-import.ts` - New batched import function
  - `src/server/mutations/index.ts` - Export new function
  - `src/components/courses/CourseSearch.tsx` - Use batched import instead of collection inserts

#### Course Management Features
- [x] **Resync Course**: "Resync" button for courses imported from API
  - Fetches fresh data from Golf Course API
  - Uses batched `resyncCourseDetails` server function
  - Deletes old tee boxes/holes, inserts new ones in single transaction
- [x] **Delete Course**: Delete button with confirmation dialog
  - Disabled when course is used by rounds
  - Shows "In Use" warning badge with round count
- [x] **Files**:
  - `src/server/mutations/course-import.ts` - Added `resyncCourseDetails` function
  - `src/routes/courses/$courseId.tsx` - Added Resync/Delete buttons

#### Round Deletion
- [x] Added delete button to each round in the rounds list
- [x] Confirmation dialog before deletion
- [x] Fixed Card asChild click issues in rounds list
- [x] **File**: `src/routes/trips/$tripId/rounds/index.tsx`

#### Duplicate Golfer Prevention
- [x] **GolferForm**: Duplicate name check when creating new golfers
  - Case-insensitive comparison
  - Shows error message with existing golfer name
- [x] **Trip Golfers**: Race condition protection in toggleGolfer
  - Double-checks collection directly before inserting
  - Prevents rapid-click duplicates
- [x] **Files**:
  - `src/components/golfers/GolferForm.tsx`
  - `src/routes/trips/$tripId/golfers.tsx`

---

### Session 2026-03-23: Electric SQL Sync Implementation

#### Electric Proxy Routes Created
- [x] Created `src/server/electric-proxy.ts` - shared utility for Electric proxy requests
- [x] Created 13 API routes in `src/routes/api/electric/`:
  - `trips.ts`, `golfers.ts`, `trip-golfers.ts`, `courses.ts`
  - `tee-boxes.ts`, `holes.ts`, `rounds.ts`, `scores.ts`
  - `round-summaries.ts`, `teams.ts`, `team-members.ts`
  - `challenges.ts`, `challenge-results.ts`
- [x] Routes proxy Electric protocol params and inject server credentials

#### Server Mutation Functions Created
- [x] Created `src/server/mutations/db.ts` - Neon SQL client helper
- [x] Created mutation files for all 13 tables:
  - Each file has `insert`, `update`, `delete` functions
  - All mutations use Neon's `sql.transaction()` for atomicity
  - Each mutation returns `{ id, txid }` for Electric reconciliation
  - Uses `txid_current()` to get transaction ID in same transaction

#### Collections Converted to Electric
- [x] Updated `src/db/collections.ts`:
  - Imported `electricCollectionOptions` from `@tanstack/electric-db-collection`
  - Converted 13 collections from `localOnlyCollectionOptions` to `electricCollectionOptions`
  - Added `shapeOptions.url` pointing to proxy routes
  - Added `timestamptz` parser for collections with timestamp columns
  - Wired up `onInsert`, `onUpdate`, `onDelete` callbacks to server mutations
  - Kept `uiStateCollection` and `formErrorCollection` as local-only

#### DataLoader Updated
- [x] Removed `seedData()` call from `DataLoader.tsx`
- [x] Electric shapes now auto-populate collections from PostgreSQL

#### Environment Configuration
- [x] Added Electric environment variables to `.envrc`:
  - `ELECTRIC_URL` - Electric service URL
  - `DATABASE_URL_DIRECT` - Direct Neon connection for logical replication
  - `ELECTRIC_SOURCE_ID` / `ELECTRIC_SECRET` - for Electric Cloud
- [x] Created `docker-compose.yml` for local Electric development

#### Documentation Updated
- [x] Updated `CLAUDE.md` with Electric SQL section:
  - Architecture diagram (Client ↔ Electric Proxy ↔ Electric ↔ PostgreSQL)
  - Local development setup with Docker
  - Environment variable configuration
  - Proxy routes and mutation flow explanation

#### Files Created
- `src/server/electric-proxy.ts`
- `src/server/mutations/db.ts`
- `src/server/mutations/index.ts`
- `src/server/mutations/trips.ts` (+ 12 more table files)
- `src/routes/api/electric/trips.ts` (+ 12 more route files)

#### Files Modified
- `src/db/collections.ts` - Electric collections
- `src/components/DataLoader.tsx` - removed seeding
- `.envrc` - Electric environment variables
- `CLAUDE.md` - Electric documentation

#### Next Steps for Testing
1. Enable logical replication in Neon: Settings → Logical Replication → Enable
2. Sign up for Electric Cloud: https://dashboard.electric-sql.cloud/
3. Connect Neon database (use direct connection string, not pooled)
4. Get `source_id` and `secret` from dashboard, add to `.envrc`
5. Run `direnv allow` to load new env vars
6. Start dev server: `pnpm dev`
7. Test: Create golfer → Refresh page → Verify persistence
8. Check database: `psql "$DATABASE_URL" -c "SELECT * FROM golfers"`

---

## Completed - Phase 7.3: Robust Sync & Offline Support

### Session 2026-03-24: Offline-First Architecture

#### Phase 1: Error Handling Foundation
- [x] Created `src/lib/errors.ts` with `RetriableError`, `PermanentError` classes
- [x] Added `isRetriable()` function for error classification (network, Postgres codes, HTTP status)
- [x] Added `wrapMutation()` helper for consistent error handling

#### Phase 2: Electric Resilience
- [x] Added CORS `Access-Control-Expose-Headers` to electric-proxy.ts
  - Required headers: `electric-offset`, `electric-handle`, `electric-schema`, `electric-cursor`
- [x] Added `onError` handler to all 13 Electric collections
  - Returns `{}` to trigger retry (returning void stops sync permanently)
- [x] Added `backoffOptions` to all collections
  - `initialDelay: 1000`, `maxDelay: 30000`, `multiplier: 2`

#### Phase 3: Offline Transaction Support
- [x] Created `src/db/offline.ts` with `OfflineExecutor` setup
  - Registers all 13 synced collections for optimistic state restoration
  - 39 mutation functions (insert/update/delete for each entity)
  - Leader election ensures only one tab processes outbox
  - Error classification with `NonRetriableError` for permanent failures
- [x] Updated `src/components/DataLoader.tsx` to initialize offline executor
- [x] Transactions persist to IndexedDB, replay on reconnection

#### Phase 4: Idempotency Key Support
- [x] Created migration `src/db/drizzle/migrations/0001_idempotency_keys.sql`
  - `idempotency_keys` table with 24-hour TTL
  - `claim_idempotency_key()` function for atomic key claiming
  - `cleanup_idempotency_keys()` function for scheduled cleanup
- [x] Added `withIdempotency()` helper to `src/server/mutations/db.ts`
  - Checks for existing key before executing mutation
  - Stores result in key for duplicate detection

#### Phase 5: Sync Status UI
- [x] Created `src/db/sync-status.ts` with local-only collection
  - Tracks `isOnline`, `pendingCount`, `lastSyncError`, `lastSyncAt`
- [x] Created `src/components/SyncStatusIndicator.tsx`
  - Shows cloud icon with color (green=synced, yellow=offline/pending, red=error)
  - Badge shows pending change count
  - Tooltip with detailed status
- [x] Added indicator to Header.tsx
- [x] Online/offline event listeners initialized in DataLoader

#### Error Handling in Mutations
- [x] Updated all 15 mutation files with `wrapMutation()`:
  - `trips.ts`, `golfers.ts`, `trip-golfers.ts`, `courses.ts`
  - `tee-boxes.ts`, `holes.ts`, `rounds.ts`, `scores.ts`
  - `round-summaries.ts`, `teams.ts`, `team-members.ts`
  - `challenges.ts`, `challenge-results.ts`, `course-import.ts`

#### Files Created
- `src/lib/errors.ts` - Error classes and classification
- `src/db/offline.ts` - Offline executor with all mutation functions
- `src/db/sync-status.ts` - Sync status collection and listeners
- `src/components/SyncStatusIndicator.tsx` - Visual sync indicator
- `src/db/drizzle/migrations/0001_idempotency_keys.sql` - Idempotency table

#### Files Modified
- `src/server/electric-proxy.ts` - Added CORS headers
- `src/server/mutations/db.ts` - Added `withIdempotency()` helper
- `src/server/mutations/*.ts` - Added error handling to all 15 files
- `src/db/collections.ts` - Added `onError` and `backoffOptions` to 13 collections
- `src/components/DataLoader.tsx` - Initialize offline executor and sync listeners
- `src/components/Header.tsx` - Added SyncStatusIndicator

#### Testing Strategy
1. Run `pnpm dev`, open app in browser
2. Open DevTools Network tab, verify Electric headers are exposed
3. Enter scores, go offline (DevTools throttling), verify pending indicator
4. Go online, verify scores sync
5. Open second tab, verify real-time sync between tabs

---

## TODO - Phase 7: Sync & Auth (Continued)

### 7.2b Electric SQL Testing & Deployment
- [ ] Enable logical replication in Neon dashboard
- [ ] Sign up for Electric Cloud at https://dashboard.electric-sql.cloud/
- [ ] Connect Neon database and get `source_id` + `secret`
- [ ] Add credentials to `.envrc` and run `direnv allow`
- [ ] Test data persistence (create → refresh → verify)
- [ ] Test real-time sync across browser tabs

### 7.3 Authentication - COMPLETE
- [x] Created magic link authentication system
- [x] Database migration for auth tables (identities, sessions, magic_links, trip_organizers, trip_invites)
- [x] Server auth mutations (requestMagicLink, verifyMagicLink, getSession, logout)
- [x] Authorization functions (getTripRole, requireOrganizer, requireTripAccess)
- [x] Trip invite system (createTripInvite, acceptTripInvite, getInviteInfo)
- [x] AuthContext provider with refresh and signOut
- [x] Login routes (/login, /login/verify) with code countdown
- [x] Invite route (/invite/$token) with accept flow
- [x] UserMenu component in Header (Sign In / email + logout)
- [x] Auto-add creator as organizer on trip creation
- [x] Electric collections for identities, trip_organizers, trip_invites

### 7.4 Authorization & Multi-tenancy
- [ ] Wire up useTripRole hook to trip management UI
- [ ] Hide management controls for participants (role-based UI)
- [ ] Row-level security in Postgres (optional)
- [ ] Filter shapes by user/trip membership
- [ ] Test data isolation between users

### 7.5 Multi-user Testing
- [ ] Test concurrent score entry by multiple users
- [ ] Test real-time leaderboard updates
- [ ] Test offline mode and reconnection
- [ ] Test conflict resolution edge cases
- [ ] Load testing with multiple simultaneous users

### Reference Skills
When implementing, load these TanStack DB skills:
- `node_modules/@electric-sql/client/skills/electric-new-feature/SKILL.md`
- `node_modules/@electric-sql/client/skills/electric-shapes/SKILL.md`
- `node_modules/@electric-sql/client/skills/electric-postgres-security/SKILL.md`
- `node_modules/@tanstack/db/skills/db-core/collection-setup/SKILL.md`

---

## File Structure

```
src/
├── components/
│   ├── ClientOnly.tsx          # SSR wrapper
│   ├── DataLoader.tsx          # Auto-seeds data
│   ├── Header.tsx              # Navigation
│   ├── ThemePicker.tsx         # Font themes
│   ├── challenges/
│   │   ├── ChallengeCard.tsx   # Challenge display component
│   │   ├── ChallengeForm.tsx   # Create/edit challenge
│   │   └── ChallengeResultEntry.tsx  # Enter manual results
│   ├── golfers/
│   │   ├── GolferCard.tsx
│   │   └── GolferForm.tsx
│   ├── leaderboards/
│   │   └── LeaderboardTable.tsx
│   ├── scoring/
│   │   ├── Scorecard.tsx
│   │   ├── ScoreEntry.tsx
│   │   └── ScoreSummary.tsx
│   ├── trips/
│   │   ├── TripCard.tsx
│   │   └── TripForm.tsx
│   └── ui/
│       ├── EmptyState.tsx
│       └── StatCard.tsx
├── contexts/
│   └── ThemeContext.tsx
├── contexts/
│   ├── ThemeContext.tsx        # Font theme state
│   └── AuthContext.tsx         # Auth session state + refresh/signOut
├── db/
│   ├── collections.ts          # TanStack DB schemas + uiStateCollection
│   └── seed.ts                 # Sample data
├── hooks/
│   ├── useDialogState.ts       # Controlled dialog state via TanStack DB
│   ├── useRequireAuth.ts       # Redirect to login if not authenticated
│   └── useTripRole.ts          # Get user's role for a trip
├── server/
│   └── auth/
│       ├── utils.ts            # Code/token generation, cookies
│       ├── mutations.ts        # requestMagicLink, verifyMagicLink, getSession, logout
│       ├── authorization.ts    # getTripRole, requireOrganizer, requireTripAccess
│       └── invites.ts          # createTripInvite, acceptTripInvite, getInviteInfo
├── lib/
│   ├── challenges.ts           # Challenge utilities (distance parsing, etc.)
│   └── scoring.ts              # Golf scoring logic
└── routes/
    ├── __root.tsx
    ├── index.tsx               # Home
    ├── login.tsx               # Email entry for magic link
    ├── login.verify.tsx        # Code verification with countdown
    ├── invite.$token.tsx       # Trip invite acceptance
    ├── golfers/
    │   ├── index.tsx           # Golfer directory
    │   └── $golferId.tsx       # Golfer detail
    └── trips/
        ├── index.tsx           # Trip list
        ├── new.tsx             # Create trip
        └── $tripId/
            ├── index.tsx       # Trip dashboard
            ├── challenges.tsx  # Challenges management
            ├── golfers.tsx     # Manage participants
            ├── leaderboards.tsx
            ├── teams.tsx
            └── rounds/
                ├── index.tsx
                ├── new.tsx
                └── $roundId/
                    ├── index.tsx
                    └── scorecard.tsx
```
