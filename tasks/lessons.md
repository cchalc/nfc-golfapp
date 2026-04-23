# Lessons Learned

## TanStack DB + SSR

**Issue**: TanStack DB collections are client-only. Attempting to use them with SSR enabled causes server-side errors.

**Solution**:
- Add `ssr: false` to all routes that use TanStack DB
- Use a `ClientOnly` wrapper component for browser-dependent code in the root layout
- The root route should NOT have `ssr: false` (it needs to render the HTML shell), but child components that use browser APIs should be wrapped in ClientOnly

**Pattern**:
```tsx
// Route file
export const Route = createFileRoute('/my-route')({
  ssr: false,  // Required for TanStack DB
  component: MyComponent,
})
```

## Collection Iteration

**Issue**: Iterating over a TanStack DB collection returns `[key, value]` tuples, not just values.

**Solution**: Use `.entries()` and destructure:
```tsx
for (const [, item] of collection.entries()) {
  // use item
}
```

## Zod Schema Transforms

**Issue**: When using `.transform()` on schema fields (e.g., string → Date), the input type must accept both forms for `update()` to work with the draft proxy.

**Solution**: Use `z.union()` before transform:
```tsx
const dateField = z
  .union([z.string(), z.date()])
  .transform((val) => (typeof val === 'string' ? new Date(val) : val))
```

## Fish Shell Syntax

**Issue**: This project uses fish shell, not bash.

**Rules**:
- No `for x in ...; do ... done` - use `for x in ...; ...; end`
- No `$()` for command substitution - use `set VAR (command)`
- No `export VAR=value` - use `set -x VAR value`
- Commands separated by `;` on one line may not work as expected

## Jujutsu (jj) for Version Control

**Rule**: Use `jj` commands instead of `git` for all version control operations.

## pnpm over npm

**Rule**: Use `pnpm` for package management, not `npm`.

## No useState

**Rule**: Per project guidelines, use TanStack DB for all state management. For UI-only state, use a local-only collection. However, existing code (ThemeContext) uses useState - should be migrated in future.

## Live Query Dependencies

**Critical**: Always include external reactive values in the dependency array for `useLiveQuery`:
```tsx
// Correct
const { data } = useLiveQuery(
  (q) => q.from({ t: collection }).where(({ t }) => eq(t.userId, userId)),
  [userId]  // Include userId in deps
)
```

## Query Builder Constraints

TanStack DB's query builder has IVM constraints:
- Join conditions must use `eq()` only (equality joins)
- `orderBy` required for `limit`/`offset`
- `distinct` requires `select`
- `having` requires `groupBy`

## Capsize Typography + Radix Gap

**Issue**: Capsize generates aggressive negative margins via `::before`/`::after` pseudo-elements to trim leading/descender space from text. When combined with small Radix gaps, vertically stacked text elements can appear crowded or overlap.

**Guidelines**:

| Context | Recommended Gap | Example |
|---------|-----------------|---------|
| Page headers (title + subtitle) | `gap="3"` or `gap="4"` | Heading + description text |
| Stat displays (label + value) | `gap="2"` | "Golfers" + "10" |
| Card content with multiple sections | `gap="4"` | Title + description + metadata row |
| Form fields (label + input) | `gap="1"` | Label + TextField (OK - inputs aren't capsize-trimmed) |
| List items between cards | `gap="2"` or `gap="3"` | Card list spacing |

**Examples**:
```tsx
// ❌ DON'T - will cause text overlap/crowding
<Flex direction="column" gap="1">
  <Heading size="6">{title}</Heading>
  <Text size="2" color="gray">{subtitle}</Text>
</Flex>

// ✅ DO - page headers need gap="3"
<Flex direction="column" gap="3">
  <Heading size="7">{title}</Heading>
  <Text color="gray">{subtitle}</Text>
</Flex>

// ✅ DO - stat cards need gap="2" minimum
<Flex direction="column" align="center" gap="2">
  <Text size="1" color="gray">Label</Text>
  <Text size="5" weight="bold">{value}</Text>
</Flex>

// ✅ DO - cards with multiple text sections need gap="4"
<Flex direction="column" gap="4">
  <Heading size="4">{title}</Heading>
  <Text color="gray">{description}</Text>
  <Flex gap="4">{metadata}</Flex>
</Flex>
```

**Don't**: Override `line-height` in CSS - capsize computes precise line-heights based on font metrics.

## TanStack Start startInstance Export

**Issue**: TanStack Start's router plugin generates `routeTree.gen.ts` which imports `startInstance` from `./start.ts`. If `start.ts` exists but doesn't export `startInstance`, the app renders a black screen with no React hydration errors.

**Root cause**: The generated code at the bottom of `routeTree.gen.ts` has:
```typescript
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
```

**Solution**: Ensure `src/start.ts` exports `startInstance`:
```typescript
// Any custom code (like tidewave import)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  import('tidewave/tanstack');
}

// Required export for TanStack Start
export const startInstance = undefined
```

**Symptom**: Black screen, no console errors, React never hydrates, SSR HTML is rendered but client JS fails silently.

## Radix Card asChild + Flex Gap

**Issue**: When using `<Card asChild>` with a direct `<Flex direction="column">` child, the gap property doesn't work. The Card's `display: block` overrides the Flex's `display: flex`, causing the gap to be ignored even though the CSS classes are merged correctly.

**Diagnosis**: Use browser DevTools to inspect the element:
```javascript
// Check computed styles
getComputedStyle(cardElement).display  // "block" - problem!
getComputedStyle(cardElement).gap      // "48px" - set but ignored
```

**Root cause**: The `asChild` pattern merges classes but CSS specificity causes the Card's `display: block` to win over Flex's `display: flex`.

**Solution**: Don't use `asChild` when you need Flex gap. Nest the Flex inside the Card instead:
```tsx
// ❌ DON'T - gap won't work
<Card asChild>
  <Flex direction="column" gap="5">
    <Heading>{title}</Heading>
    <Text>{description}</Text>
  </Flex>
</Card>

// ✅ DO - gap works correctly
<Card>
  <Flex direction="column" gap="5">
    <Heading>{title}</Heading>
    <Text>{description}</Text>
  </Flex>
</Card>
```

**When asChild IS okay**: For horizontal Flex layouts where you just need `justify-between` and `align-center` without vertical stacking gaps.

## Neon MCP vs psql

**Issue**: The Neon MCP server uses `npx -y @neondatabase/mcp-server-neon start` which requires npm registry access. On corporate VPNs or networks that block npm, the MCP server will fail to connect on every Claude Code restart.

**Diagnosis**: Run `npm ping` or `curl https://registry.npmjs.org/` - if ECONNREFUSED, npm is blocked.

**Solution**: Use `psql "$DATABASE_URL"` directly for all database operations. The DATABASE_URL is set in `.envrc` and works regardless of npm access.

```fish
# Query the database
psql "$DATABASE_URL" -c "SELECT * FROM users LIMIT 10"

# List tables
psql "$DATABASE_URL" -c "\\dt"

# Run migrations
psql "$DATABASE_URL" -f db/schema.sql
```

**Note**: If MCP features are needed (branch management, project creation), disconnect from VPN and restart Claude Code.

## Neon Pooled vs Direct Connections

**Issue**: Electric SQL fails to connect with error "Unable to connect to your database in replication mode" when using Neon's pooled connection string.

**Root cause**: Neon provides two connection types:
- **Pooled** (hostname contains `-pooler`): Routes through PgBouncer, doesn't support logical replication
- **Direct** (no `-pooler`): Connects straight to Postgres, supports logical replication

**Example**:
```
# Pooled - WON'T work with Electric
postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db

# Direct - REQUIRED for Electric
postgresql://user:pass@ep-xxx.region.aws.neon.tech/db
```

**Solution**: Use two connection strings in `.envrc`:
```fish
# For app queries (serverless driver)
export DATABASE_URL="postgresql://...@ep-xxx-pooler.region.aws.neon.tech/db"

# For Electric SQL (logical replication)
export DATABASE_URL_DIRECT="postgresql://...@ep-xxx.region.aws.neon.tech/db"
```

**Additional requirement**: Enable logical replication in Neon dashboard (Settings → Logical Replication → Enable). This is a one-time, permanent change that briefly restarts the database.

## Electric SQL Snake Case to Camel Case Column Mapping

**Issue**: Electric shapes return data from PostgreSQL with snake_case column names (e.g., `start_date`), but the Zod schemas expect camelCase (e.g., `startDate`). Fields end up as `undefined`.

**Symptom**: `Cannot read properties of undefined (reading 'toLocaleDateString')` when accessing date fields.

**Root cause**: PostgreSQL uses snake_case column names. Without column mapping, the Electric shape delivers `{ start_date: '2026-03-27' }` but the schema expects `{ startDate: Date }`.

**Solution**: Use `snakeCamelMapper` from `@electric-sql/client`:

```tsx
import { snakeCamelMapper } from '@electric-sql/client'

// Create mapper once
const columnMapper = snakeCamelMapper()

// Add to every Electric collection's shapeOptions
export const tripCollection = createCollection(
  electricCollectionOptions({
    id: 'trips',
    schema: tripSchema,
    shapeOptions: {
      url: getShapeUrl('/api/electric/trips'),
      parser: { timestamptz: (date: string) => new Date(date) },
      columnMapper,  // <-- Add this
    },
    // ...
  })
)
```

**Note**: The column mapper handles bidirectional mapping:
- Read: `start_date` → `startDate`
- Write: `startDate` → `start_date` (in WHERE clauses)

## TanStack Start Server Functions (Not Plain Async Functions)

**Issue**: Plain async functions in server files cannot be called from the client. They must be wrapped with `createServerFn` to be callable across the server/client boundary.

**Root cause**: TanStack Start server functions use RPC under the hood. Plain async functions only exist on the server and aren't exposed as callable endpoints.

**Symptom**: Calling a plain async function from client code either silently fails or throws "not a function" errors at runtime.

**Solution**: Always use `createServerFn` for functions that need to be called from the client:

```tsx
// ❌ DON'T - plain async function (server-only)
export async function insertGolfer(golfer: Golfer) {
  const sql = getDb()
  // This won't be callable from the client
}

// ✅ DO - server function (callable from client)
export const insertGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: Golfer) => data)
  .handler(async ({ data: golfer }) => {
    const sql = getDb()
    // Now callable from client via RPC
  })
```

## TanStack Start Server Function Call Signature

**Issue**: Server functions created with `createServerFn().inputValidator().handler()` require callers to wrap the data in `{ data: ... }`.

**Root cause**: The `.inputValidator()` method expects the input in a specific format. TypeScript error: `Property 'data' is missing in type '...' but required in type 'RequiredFetcherDataOptions<...>'`.

**Solution**: Always call server functions with `{ data: ... }` wrapper:

```tsx
// Server function definition
export const insertGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: Golfer) => data)
  .handler(async ({ data: golfer }) => {
    // data comes unwrapped here
  })

export const updateGolfer = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; changes: Partial<Golfer> }) => data)
  .handler(async ({ data: { id, changes } }) => {
    // destructure from data
  })

// ❌ DON'T - missing data wrapper
await insertGolfer(golfer)
await updateGolfer({ id, changes })

// ✅ DO - wrap in { data: ... }
await insertGolfer({ data: golfer })
await updateGolfer({ data: { id, changes } })
```

**Pattern for Electric collections**:
```tsx
onInsert: async ({ transaction }) => {
  const { modified: item } = transaction.mutations[0]
  const { txid } = await insertItem({ data: item })  // Wrap in { data }
  return { txid }
},
onUpdate: async ({ transaction }) => {
  const { modified: item } = transaction.mutations[0]
  const { txid } = await updateItem({ data: { id: item.id, changes: item } })
  return { txid }
},
onDelete: async ({ transaction }) => {
  const { original: item } = transaction.mutations[0]
  const { txid } = await deleteItem({ data: { id: item.id } })
  return { txid }
},
```

## Radix Dialog Closing Pattern

**Issue**: Using `document.querySelector('[data-radix-dialog-close]')?.click()` to close dialogs fails when no `<Dialog.Close>` element exists in the dialog. The selector returns `null` and the dialog stays open after form submission.

**Root cause**: The pattern assumes a `<Dialog.Close>` button exists, but many dialogs only have action buttons (Save, Submit) without an explicit close button.

**Solution**: Use controlled dialog state via TanStack DB collection:

```tsx
// src/hooks/useDialogState.ts
import { useLiveQuery, eq } from '@tanstack/react-db'
import { uiStateCollection } from '../db/collections'

export function useDialogState(dialogId: string): [boolean, (open: boolean) => void] {
  const { data: uiStates } = useLiveQuery(
    (q) => q.from({ ui: uiStateCollection }).where(({ ui }) => eq(ui.dialogId, dialogId)),
    [dialogId]
  )
  const isOpen = uiStates?.[0]?.isOpen ?? false

  const setOpen = (open: boolean) => {
    const existing = uiStates?.[0]
    if (existing) {
      uiStateCollection.update(existing.id, (d) => { d.isOpen = open })
    } else {
      uiStateCollection.insert({ id: crypto.randomUUID(), dialogId, isOpen: open })
    }
  }

  return [isOpen, setOpen]
}

// Usage in component
function MyPage() {
  const [dialogOpen, setDialogOpen] = useDialogState('edit-item-123')

  return (
    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
      <Dialog.Trigger>
        <Button>Edit</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <MyForm onSuccess={() => setDialogOpen(false)} />
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

**Benefits**:
- Works with any dialog, no `<Dialog.Close>` element required
- Follows TanStack DB state management pattern (no useState)
- Dialog state persists correctly through re-renders
- Clean separation between form logic and dialog control

## Dialog State Race Condition with Electric SQL

**Issue**: When using `useDialogState` with Electric SQL sync, the `setOpen` callback captures a stale reference to `uiState` from the `useLiveQuery` closure. This causes:
1. Multiple inserts instead of updates (duplicate UI state entries)
2. Dialogs that won't close after form submission

**Root cause**: The callback checks `if (uiState) {...}` but `uiState` comes from `useLiveQuery`, which returns data asynchronously. By the time `setOpen` is called, the queried state may be stale or not yet exist.

**Symptom**: Clicking "Add" opens the dialog, but after form submission, calling `setOpen(false)` doesn't close it. Console may show multiple inserts.

**Solution**: Query the collection directly in the callback to get fresh state:

```tsx
import { useCallback } from 'react'

export function useDialogState(dialogId: string): [boolean, (open: boolean) => void] {
  const { data: uiStates } = useLiveQuery(
    (q) => q.from({ ui: uiStateCollection }).where(({ ui }) => eq(ui.dialogId, dialogId)),
    [dialogId]
  )
  const isOpen = uiStates?.[0]?.isOpen ?? false

  // Query collection directly to avoid stale closure
  const setOpen = useCallback(
    (open: boolean) => {
      const entries = [...uiStateCollection]  // Direct iteration
      const existing = entries.find(([, s]) => s.dialogId === dialogId)

      if (existing) {
        uiStateCollection.update(existing[0], (d) => { d.isOpen = open })
      } else {
        uiStateCollection.insert({
          id: crypto.randomUUID(),
          dialogId,
          isOpen: open,
        })
      }
    },
    [dialogId]
  )

  return [isOpen, setOpen]
}
```

**Key insight**: TanStack DB collections are iterable and can be queried synchronously via spread (`[...collection]`), which returns `[key, value]` tuples. This avoids the async timing issues with `useLiveQuery`.

## Electric SQL: Batch Multiple Inserts in a Transaction

**Issue**: When importing related data (e.g., a course with 18 holes and multiple tee boxes), inserting each record separately via `collection.insert()` causes:
1. Each insert triggers an `onInsert` callback → server mutation
2. Multiple concurrent mutations overwhelm Electric's sync
3. Data may appear then disappear as Electric reconciles
4. Race conditions between inserts and the Electric shape subscription

**Symptom**: Imported course holes show up initially, then vanish. Or only some holes persist.

**Root cause**: TanStack DB's `collection.insert()` is optimistic - it adds to local state immediately and fires the `onInsert` mutation asynchronously. When 20+ inserts fire in rapid succession:
- The server receives 20+ concurrent mutation requests
- Each returns a different `txid`
- Electric tries to reconcile all of them
- Timing issues cause some data to be dropped

**Solution**: For batch operations, bypass the collection and use a single server function that runs everything in one database transaction:

```tsx
// src/server/mutations/course-import.ts
export const importCourseWithDetails = createServerFn({ method: 'POST' })
  .inputValidator((data: { course: Course, teeBoxes: TeeBox[], holes: Hole[] }) => data)
  .handler(async ({ data: { course, teeBoxes, holes } }) => {
    const sql = neon(process.env.DATABASE_URL!)

    const results = await sql.transaction((txn) => {
      const queries = []

      // Insert course
      queries.push(txn`INSERT INTO courses (...) VALUES (...)`)

      // Insert all tee boxes
      for (const tee of teeBoxes) {
        queries.push(txn`INSERT INTO tee_boxes (...) VALUES (...)`)
      }

      // Insert all holes
      for (const hole of holes) {
        queries.push(txn`INSERT INTO holes (...) VALUES (...)`)
      }

      // Get single txid for Electric reconciliation
      queries.push(txn`SELECT txid_current()::text AS txid`)

      return queries
    })

    return { txid: parseInt(results[results.length - 1][0].txid) }
  })

// In component - call server function directly, not collection.insert()
const result = await importCourseWithDetails({
  data: { course, teeBoxes, holes },
})
// Electric syncs the data back to collections automatically
```

**Benefits**:
- Single database transaction ensures atomicity
- Single `txid` for Electric to reconcile
- No race conditions between inserts
- Data appears all at once after Electric syncs
- Better error handling (entire import succeeds or fails together)

**When to use this pattern**:
- Importing data from external APIs (courses, tournaments)
- Creating related records together (trip + golfers + rounds)
- Any operation that creates 5+ records at once
- Migrating or bulk-inserting data

## Electric SQL: Performance with Many Shape Subscriptions

**Issue**: App sluggishness when using Electric Cloud with many collections (13+ shapes). Each shape subscription requires:
1. Initial request with `offset=-1` to get metadata/handle
2. Follow-up request(s) with handle to get actual data
3. Persistent SSE connection for real-time updates

**Symptoms**:
- App takes several seconds to become interactive after page load
- Network tab shows many pending requests
- UI feels sluggish/unresponsive during initial sync

**Root causes**:
1. **Network latency to Electric Cloud**: ~300-500ms per request
2. **HTTP/1.1 connection limit**: Browsers limit 6 concurrent connections per origin
3. **Eager sync mode**: All shapes try to load complete dataset upfront
4. **13 shapes × 2+ requests × 300ms = 8+ seconds** just for initial sync

**Solution**: Use `syncMode: 'progressive'` on Electric collections:

```typescript
export const myCollection = createCollection(
  electricCollectionOptions({
    id: 'my_table',
    schema: mySchema,
    getKey: (item) => item.id,
    syncMode: 'progressive',  // <-- Add this
    shapeOptions: {
      url: getShapeUrl('/api/electric/my-table'),
      columnMapper,
    },
    // ...handlers
  })
)
```

**How progressive mode helps**:
1. Queries initially fetch just the data they need (not entire table)
2. Full sync happens in background after UI is interactive
3. Reduces initial blocking time significantly

**Additional mitigations**:
- **HTTP/2 proxy**: Use Caddy to allow more concurrent connections locally
- **Self-host Electric**: Eliminates cloud latency (~300ms → ~10ms)
- **Lazy-load collections**: Only create shapes when routes need them
- **Add WHERE clauses**: Scope shapes to relevant data subset (e.g., by trip_id)

**Diagnosis commands**:
```bash
# Test Electric proxy latency
time curl -s "http://localhost:5173/api/electric/golfers?offset=-1" -o /dev/null

# Check if Electric Cloud is returning data
curl -s "http://localhost:5173/api/electric/golfers?offset=-1" | head

# Get data using handle from first request
curl -s "http://localhost:5173/api/electric/golfers?offset=0_0&handle=<HANDLE>"
```

**Note**: Electric's protocol is two-phase - first request returns metadata/handle, subsequent requests return data. Empty `snapshot-end` responses are normal for the first request.

## Email-Based User Linking (Admin Adds Golfer Flow)

**Pattern**: When an admin adds a golfer to a trip, the golfer can later log in and automatically get access.

**How it works**:
1. Admin creates golfer record with name and **email**
2. Admin adds golfer to trip (creates `trip_golfers` entry)
3. Golfer visits app and logs in with their email
4. `verifyMagicLink` checks: "Is there a golfer with this email?"
5. If yes, auto-links `identity.golferId` to that golfer
6. Golfer now has access to all trips they were added to

**Key code** (in `src/server/auth/mutations.ts`):
```typescript
// During login, check for existing golfer by email
const golfers = await sql`
  SELECT id FROM golfers
  WHERE LOWER(email) = ${normalizedEmail}
  LIMIT 1
`
if (golfers.length > 0) {
  golferId = golfers[0].id as string
}
// Link to identity
await sql`INSERT INTO identities (email, golfer_id, ...) VALUES (...)`
```

**Critical**: Admin must enter the golfer's **actual email address** for auto-linking to work.

## Field-Level Permissions Pattern

**Pattern**: Server mutations should check authorization before modifying data.

**Model**:
| Role | Own Data | Others' Data |
|------|----------|--------------|
| Owner/Organizer | ✅ Edit | ✅ Edit |
| Participant | ✅ Edit | ❌ Denied |
| None | ❌ Denied | ❌ Denied |

**Implementation** (in mutation files):
```typescript
import { getTripRole } from '../auth/authorization'
import { getSession } from '../auth/mutations'

async function requireScoreAccess(roundId: string, golferId: string): Promise<void> {
  const session = await getSession()
  if (!session) throw new Error('Not authenticated')

  // Look up trip from round
  const sql = getDb()
  const rounds = await sql`SELECT trip_id FROM rounds WHERE id = ${roundId}`
  if (rounds.length === 0) throw new Error('Round not found')

  const tripId = rounds[0].trip_id as string
  const access = await getTripRole({ data: { tripId } })

  // Organizers can edit all
  if (access.role === 'owner' || access.role === 'organizer') return

  // Participants can only edit their own
  if (access.role === 'participant' && access.golferId === golferId) return

  throw new Error('Unauthorized')
}

// Use in mutation handler
export const updateScore = createServerFn({ method: 'POST' })
  .inputValidator(...)
  .handler(async ({ data }) => {
    await requireScoreAccess(data.roundId, data.golferId)  // Check first!
    // ... do the update
  })
```

**Note**: Authorization should be in server mutations (enforced), not just UI (bypassable).

## Schema Field Naming: roundDate vs date

**Issue**: The `rounds` table schema uses `roundDate` but code often assumes `date`.

**Symptom**: TypeScript error "Property 'date' does not exist on type..."

**Solution**: Always use `round.roundDate` in code:
```typescript
// ❌ DON'T
const dateStr = new Date(round.date).toLocaleDateString()

// ✅ DO
const dateStr = new Date(round.roundDate).toLocaleDateString()
```

**Prevention**: Check `src/db/collections.ts` schema definitions when unsure about field names.

## Dead Code from Non-Existent Enum Values

**Issue**: Code checking for enum values that don't exist in the schema causes TypeScript errors.

**Symptom**: `This comparison appears to be unintentional because the types have no overlap`

**Example**:
```typescript
// Schema only has: closest_to_pin, longest_drive, most_birdies, custom
// This code checks for values that don't exist:
if (challenge.challengeType === 'best_net') {  // TS error - 'best_net' not in enum
  // dead code
}
```

**Solution**: Remove dead code or add missing values to the schema if actually needed.
