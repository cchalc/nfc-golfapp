# Golf Trip Planner

A real-time golf trip management app with TanStack Start, Electric SQL, and Radix UI.

## Development Commands

```fish
pnpm dev              # Start dev server (port 5173)
pnpm build            # Production build
pnpm check            # Biome lint & format

# Database
psql "$DATABASE_URL" -c "\\dt"                    # List tables
psql "$DATABASE_URL" -f src/db/drizzle/migrations/XXXX.sql  # Run migration

# Version Control (Jujutsu only - never use git)
jj status             # Show changes
jj diff               # Show diff
jj new -m "message"   # Create new commit
jj git push           # Push to remote
```

## Architecture

**Stack Foundation**: Electric SQL for reads, server functions for writes, TanStack DB for optimistic updates.

```
Client (TanStack DB) <--> Electric Proxy Routes <--> Electric Cloud <--> Neon PostgreSQL
```

### Data Flow

**Reading data** — Use Electric SQL shapes via TanStack DB collections:
```tsx
// In components, use useLiveQuery with dependency array
const { data: trips } = useLiveQuery(
  (q) => q.from({ trip: tripCollection }).select(),
  []
)
```

**Writing data** — Call collection methods directly (triggers server mutations):
```tsx
// Insert (optimistic update + server mutation)
tripCollection.insert({ id: crypto.randomUUID(), name: 'New Trip', ... })

// Update
tripCollection.update({ id: tripId, name: 'Updated Name' })

// Delete
tripCollection.delete({ id: tripId })
```

### Directory Organization

```
src/
├── components/       # UI components (PascalCase.tsx)
├── contexts/         # React contexts (AuthContext, ThemeContext)
├── db/
│   ├── collections.ts    # TanStack DB schemas + Electric collections
│   ├── drizzle/
│   │   ├── schema.ts     # Drizzle table definitions
│   │   └── migrations/   # SQL migration files
│   └── sync-status.ts    # Offline sync status
├── hooks/            # Custom hooks (useDialogState, useRequireAuth, useTripRole)
├── lib/              # Utilities (scoring.ts, challenges.ts, errors.ts)
├── routes/
│   ├── api/electric/     # Electric proxy routes (one per table)
│   └── ...               # Page routes
└── server/
    ├── auth/             # Authentication (mutations, authorization, invites)
    ├── electric-proxy.ts # Shared Electric proxy handler
    └── mutations/        # Server mutation functions (one per table)
```

### Naming Standards

| Context | Convention | Example |
|---------|------------|---------|
| Database fields | snake_case | `created_at`, `golfer_id` |
| TypeScript/Zod | camelCase | `createdAt`, `golferId` |
| Files | kebab-case or PascalCase | `trip-golfers.ts`, `TripCard.tsx` |
| Routes | kebab-case | `/api/electric/trip-golfers` |

## Critical Constraints

- **NEVER** read data via server functions — only Electric SQL shapes
- **NEVER** use `useState` for data — use TanStack DB collections (even for UI state)
- **NEVER** use `git` commands — use `jj` (Jujutsu) only
- **NEVER** use bash syntax — use fish shell syntax only
- **ALWAYS** include `txid_current()` in mutations for Electric reconciliation
- **ALWAYS** use `REPLICA IDENTITY FULL` on synced tables
- **ALWAYS** use pooled connection (`DATABASE_URL`) for queries, direct for Electric

## Electric SQL Sync

### Environment Variables

```fish
# .envrc
export DATABASE_URL="postgresql://...@ep-xxx-pooler..."      # Pooled (queries)
export DATABASE_URL_DIRECT="postgresql://...@ep-xxx..."      # Direct (Electric)
export ELECTRIC_URL="https://api.electric-sql.cloud"
export ELECTRIC_SOURCE_ID="your-source-id"
export ELECTRIC_SECRET="your-secret"
```

### Adding a New Synced Table

1. **Create migration** in `src/db/drizzle/migrations/`
2. **Add to Drizzle schema** in `src/db/drizzle/schema.ts`
3. **Add Zod schema + collection** in `src/db/collections.ts`
4. **Create server mutations** in `src/server/mutations/`
5. **Create Electric proxy route** in `src/routes/api/electric/`
6. **Run migration**: `psql "$DATABASE_URL" -f src/db/drizzle/migrations/XXXX.sql`

### Mutation Pattern

```typescript
// src/server/mutations/trips.ts
export const insertTrip = createServerFn({ method: 'POST' })
  .inputValidator((data: TripInput) => data)
  .handler(async ({ data: trip }) => {
    return wrapMutation('insertTrip', async () => {
      const sql = getDb()
      const [result, txidResult] = await sql.transaction((txn) => [
        txn`INSERT INTO trips (...) VALUES (...) RETURNING id`,
        txn`SELECT txid_current()::text AS txid`,
      ])
      return { id: result[0].id, txid: parseInt(txidResult[0].txid) }
    })
  })
```

## Authentication

Magic link email authentication with two user roles:
- **Organizer**: Full access to create/manage trips
- **Participant**: View trips, enter their own scores

### Auth Flow

```
1. POST /api/auth/login { email }     → Generate 6-char code, send email
2. POST /api/auth/verify { email, code } → Validate, create session, set cookie
3. GET /api/auth/me                   → Return session or null
4. POST /api/auth/logout              → Delete session, clear cookie
```

### Using Auth in Components

```tsx
import { useAuth } from '../contexts/AuthContext'
import { useTripRole } from '../hooks/useTripRole'

function TripPage() {
  const { session, isAuthenticated } = useAuth()
  const { role, canManage } = useTripRole(tripId)

  return (
    <>
      {canManage && <ManagementControls />}
      <TripContent />
    </>
  )
}
```

## Neon PostgreSQL

**Two connection strings** — pooled for queries, direct for Electric:

| Variable | Type | Use Case |
|----------|------|----------|
| `DATABASE_URL` | Pooled (`-pooler`) | App queries via Neon serverless driver |
| `DATABASE_URL_DIRECT` | Direct | Electric SQL logical replication |

Electric SQL **must** use the direct connection. Pooled connections fail with "Unable to connect in replication mode".

## Tidewave MCP

Dev server must be running for MCP tools. Start with `pnpm dev`.

| Tool | Description |
|------|-------------|
| `get_docs` | TypeScript/JS documentation and type info |
| `get_source_location` | Find source locations for symbols |
| `project_eval` | Evaluate code in project runtime context |
| `get_logs` | Retrieve application logs |

## Styling Rules

### Capsize Typography

Spacing between text elements must use `gap` on parent — never margins/padding on text:

```tsx
// ❌ DON'T
<Heading mb="2">Title</Heading>

// ✅ DO
<Flex direction="column" gap="3">
  <Heading>Title</Heading>
  <Text>Content</Text>
</Flex>
```

### Radix Spacing Scale

- `gap="2"` — Tight (related items)
- `gap="3"` — Default
- `gap="4"` — Comfortable
- `gap="6"` — Section separation

### State Management

Use TanStack DB for all state. For client-only UI state, use a local-only collection:

```tsx
// Local-only collection for UI state
export const uiStateCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (item) => item.id,
    schema: uiStateSchema,
  })
)
```

## Shell Environment

- **Fish Shell Only** — No bash/zsh syntax
- **Jujutsu Only** — Use `jj`, not `git`
- **No Homebrew** — Never use `brew` commands
- **No New Shells** — No tmux/screen, run commands directly

## Workflow

1. **Plan First** — Write plan to `tasks/todo.md`
2. **Track Progress** — Mark items complete as you go
3. **Capture Lessons** — Update `tasks/lessons.md` after corrections
4. **Verify Before Done** — Run tests, demonstrate correctness

## Included Skills

<!-- intent-skills:start -->
### TanStack DB (`@tanstack/db`, `@tanstack/react-db`)

- **Setting up collections** → `node_modules/@tanstack/db/skills/db-core/collection-setup/SKILL.md`
- **Live queries** → `node_modules/@tanstack/db/skills/db-core/live-queries/SKILL.md`
- **Mutations & optimistic updates** → `node_modules/@tanstack/db/skills/db-core/mutations-optimistic/SKILL.md`
- **Offline support** → `node_modules/@tanstack/offline-transactions/skills/offline/SKILL.md`

### Electric (`@electric-sql/client`)

- **New synced feature** → `node_modules/@electric-sql/client/skills/electric-new-feature/SKILL.md`
- **Shapes & sync options** → `node_modules/@electric-sql/client/skills/electric-shapes/SKILL.md`
- **Schema design** → `node_modules/@electric-sql/client/skills/electric-schema-shapes/SKILL.md`
- **Debugging sync** → `node_modules/@electric-sql/client/skills/electric-debugging/SKILL.md`
<!-- intent-skills:end -->

### Local Skills

- `frontend-design` — Create distinctive, production-grade frontend interfaces (file: `skills/frontend-design/SKILL.md`)
