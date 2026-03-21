# Golf Trip Planning App - Project Status

## Important Notes

- **SSR Disabled**: TanStack DB is client-only, so all routes have `ssr: false`
- **ClientOnly Wrapper**: Root uses a ClientOnly component to prevent SSR of browser-dependent code
- **Auto-seeding**: DataLoader seeds sample data on first app load if collections are empty
- **Version Control**: Use `jj` (Jujutsu), not `git`
- **Package Manager**: Use `pnpm`, not `npm`
- **TanStack Start**: `src/start.ts` MUST export `startInstance` (even as `undefined`) for hydration to work

## Recently Completed

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

## TODO - Phase 7: Sync & Auth (Future)

- [ ] Set up Neon PostgreSQL database
- [ ] Run schema migrations
- [ ] Configure Electric SQL for real-time sync
- [ ] Add Auth.js with Google OAuth + Email/Password
- [ ] Switch from localOnlyCollectionOptions to electricCollectionOptions
- [ ] Multi-user testing

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
├── db/
│   ├── collections.ts          # TanStack DB schemas + uiStateCollection
│   └── seed.ts                 # Sample data
├── hooks/
│   └── useDialogState.ts       # Controlled dialog state via TanStack DB
├── lib/
│   ├── challenges.ts           # Challenge utilities (distance parsing, etc.)
│   └── scoring.ts              # Golf scoring logic
└── routes/
    ├── __root.tsx
    ├── index.tsx               # Home
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
