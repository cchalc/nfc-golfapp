# Checkpoint: 2026-03-23 - Electric SQL Integration

## Branch
`electric-sql-integration` - pushed to origin

## Current State
The app has Electric SQL integration working but is experiencing sluggishness that needs investigation.

## What Was Done This Session

### 1. Electric SQL Integration
- Created proxy routes for all 13 collections (`/api/electric/*`)
- Created server mutation functions for all CRUD operations
- Collections now sync via Electric Cloud to Neon PostgreSQL

### 2. Batched Mutations (Critical Fix)
- **Problem**: 18+ concurrent inserts during course import caused holes to disappear
- **Solution**: Created `importCourseWithDetails` and `resyncCourseDetails` server functions
- These insert all data in a single database transaction with one txid for Electric reconciliation

### 3. UI Improvements
- Course detail: Resync button (re-fetch from API), Delete button (with usage check)
- Rounds list: Delete button for each round
- Fixed `Card asChild` click issues (scorecard links, round links)
- Delete buttons for trips and golfers

### 4. Data Validation
- Duplicate golfer prevention (case-insensitive name check)
- Race condition protection in trip golfer toggle

### 5. Dialog State Fix
- Fixed race condition in `useDialogState` hook
- Now queries collection directly instead of using stale closure values

## Outstanding Issues

### 1. App Sluggishness - INVESTIGATED
**Root cause identified**: Network latency to Electric Cloud (~300-500ms per request) combined with:
- 13 shape subscriptions starting simultaneously
- HTTP/1.1 browser limit (6 concurrent connections)
- Eager sync mode loading all data upfront

**Fix applied**: Added `syncMode: 'progressive'` to all 13 Electric collections. This:
- Queries fetch only needed data first
- Full sync happens in background
- Reduces initial blocking time

**Additional recommendations**:
- Self-host Electric for production (eliminates ~300ms cloud latency)
- Use Caddy as HTTP/2 proxy for local dev (removes 6-connection limit)
- Add WHERE clauses to scope shapes by trip_id where possible

### 2. Electric Cloud Sync Status
- Electric Cloud IS working - data syncs correctly
- The two-phase protocol is normal (first request returns handle, second returns data)
- Added `challenge_results` table to publication (was missing)

## Key Files Modified
```
src/server/mutations/course-import.ts  - Batched import/resync
src/routes/api/electric/*.ts           - Electric proxy routes (13 files)
src/server/mutations/*.ts              - Server mutations (13 files)
src/db/collections.ts                  - Electric collection config
src/hooks/useDialogState.ts            - Race condition fix
src/routes/courses/$courseId.tsx       - Resync/delete buttons
src/routes/trips/$tripId/rounds/index.tsx - Round deletion
```

## Environment Setup Required
```fish
# .envrc needs these variables:
export DATABASE_URL="postgresql://...@...pooler.../db"      # Pooled for app
export DATABASE_URL_DIRECT="postgresql://...@.../db"        # Direct for Electric
export ELECTRIC_URL="https://api.electric-sql.cloud"
export ELECTRIC_SOURCE_ID="your-source-id"
export ELECTRIC_SECRET="your-secret"
```

## Next Steps
1. **Investigate sluggishness** - Profile, identify bottleneck
2. **Consider pagination** - Reduce data loaded at once
3. **Add loading indicators** - Better UX during sync
4. **Test data integrity** - Verify all CRUD operations sync correctly

## Commands to Resume
```fish
cd /Users/christopher.chalcraft/cowork/projects/nfc-golfapp
pnpm dev
# App runs on http://localhost:5173 (or next available port)
```

## Relevant Documentation
- [Electric SQL Docs](https://electric-sql.com/docs)
- [TanStack DB Docs](https://tanstack.com/db)
- `CLAUDE.md` - Project setup instructions
- `tasks/lessons.md` - Patterns and gotchas learned
