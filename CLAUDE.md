# Kyle's Stack

A starter for building apps with TanStack Start, Radix UI, and capsize typography.

## Tidewave MCP

This project uses [Tidewave](https://github.com/tidewave-ai/tidewave_js) MCP for enhanced development tooling. The MCP server runs on the Vite dev server.

### Setup Requirements

1. **Dev server must be running** before starting a session for MCP tools to connect
2. Start the dev server: `pnpm dev` (runs on port 5173)
3. MCP is configured with SSE transport at `http://localhost:5173/tidewave/mcp`

### Available Tools

| Tool | Description |
|------|-------------|
| `get_docs` | Get TypeScript/JavaScript documentation and type info for symbols |
| `get_source_location` | Find source locations for symbols in project or dependencies |
| `project_eval` | Evaluate JS/TS code in the project runtime context |
| `get_logs` | Retrieve application logs for debugging |

### Usage

- Use `get_docs` to look up types, functions, and API documentation
- Use `project_eval` to test code snippets in the actual project context
- Use `get_logs` to debug runtime issues

## Electric SQL Sync

This project uses [Electric SQL Cloud](https://electric-sql.com/product/cloud) for real-time sync between PostgreSQL and the client. Data flows through TanStack DB collections with optimistic mutations.

### Architecture

```
Client (TanStack DB) <--> Electric Proxy Routes <--> Electric Cloud <--> Neon PostgreSQL
```

1. **Electric shapes** stream changes from PostgreSQL to the client
2. **Mutations** go client → server function → PostgreSQL → txid → Electric sync

### Setup

1. **Enable logical replication in Neon**: Settings → Logical Replication → Enable
2. **Sign up for Electric Cloud**: https://dashboard.electric-sql.cloud/
3. **Connect your Neon database**: Use the direct (non-pooled) connection string
4. **Get credentials**: Electric Cloud will provide `source_id` and `secret`
5. **Set environment variables** in `.envrc`

### Environment Variables

```fish
# .envrc
export ELECTRIC_URL="https://api.electric-sql.cloud"
export ELECTRIC_SOURCE_ID="your-source-id"    # From Electric Cloud dashboard
export ELECTRIC_SECRET="your-secret"          # From Electric Cloud dashboard
```

### Proxy Routes

Electric shape requests are proxied through TanStack Start API routes at `/api/electric/<table>`:

- `/api/electric/trips`, `/api/electric/golfers`, etc.

The proxy routes inject `source_id` and `secret` server-side (never exposed to client).

### Mutation Flow

Collections wire up `onInsert`/`onUpdate`/`onDelete` handlers that:
1. Call server mutation functions in `src/server/mutations/`
2. Mutations execute SQL + `txid_current()` in a transaction
3. Return `{ txid }` for Electric reconciliation

## Neon PostgreSQL

This project uses [Neon](https://neon.tech) PostgreSQL with **two connection strings**:

| Variable | Type | Use Case |
|----------|------|----------|
| `DATABASE_URL` | Pooled | App queries via Neon serverless driver |
| `DATABASE_URL_DIRECT` | Direct | Electric SQL logical replication |

### Pooled vs Direct Connections

**Pooled** (has `-pooler` in hostname):
```
postgresql://...@ep-xxx-pooler.region.aws.neon.tech/...
```
- Routes through PgBouncer connection pooler
- Good for serverless/edge functions with many short-lived connections
- **Cannot** do logical replication

**Direct** (no `-pooler`):
```
postgresql://...@ep-xxx.region.aws.neon.tech/...
```
- Connects straight to Postgres
- Required for logical replication (Electric SQL)
- Use for any operation needing persistent connections

### Electric SQL Requirement

Electric SQL **must** use the direct connection string. The pooled connection will fail with "Unable to connect in replication mode" because PgBouncer doesn't support logical replication.

### Database Access

Use `psql` directly for all database operations:

```fish
# Run a query
psql "$DATABASE_URL" -c "SELECT * FROM users LIMIT 10"

# Interactive session
psql "$DATABASE_URL"

# Run a SQL file
psql "$DATABASE_URL" -f migrations/001_init.sql
```

### Common Operations

```fish
# List all tables
psql "$DATABASE_URL" -c "\\dt"

# Describe a table
psql "$DATABASE_URL" -c "\\d tablename"

# Run migrations
psql "$DATABASE_URL" -f db/schema.sql
```

### Neon MCP (Optional)

The Neon MCP server provides additional tools but requires npm registry access. If npm is blocked (e.g., corporate VPN), use `psql` instead.

To set up the MCP server (requires npm access):

```fish
claude mcp add neon -s local -e NEON_API_KEY=<your-api-key> -- npx -y @neondatabase/mcp-server-neon start
```

Then restart Claude Code. If it fails to connect, check `npm ping` to verify registry access.

## Shell Environment

- **Fish Shell Only**: This computer runs fish shell. Always use fish shell syntax, not bash/zsh.
- No `for x in ...; do ... done` - use `for x in ...; ...; end`
- No `$()` for command substitution in variable assignment - use `set VAR (command)`
- No `export VAR=value` - use `set -x VAR value`
- **No Homebrew**: Never use `brew` commands on this computer.
- **Jujutsu Only**: Use `jj` for version control, not `git` commands.
- **No New Shells**: Never open tmux, screen, or new shell sessions. Run all commands directly in the current fish shell.

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Stack

- **TanStack Start** - Full-stack React framework (SPA/SSR, deploys everywhere)
- **Radix UI** - Accessible component library with themes
- **vite-plugin-capsize-radix** - Pixel-perfect typography
- **Dozens of font pairings included** - Ask the agent to set one up

## Project Structure

```
src/
├── components/
│   ├── Header.tsx        # App header with ThemePicker
│   └── ThemePicker.tsx   # Font theme dropdown
├── contexts/
│   └── ThemeContext.tsx  # Font theme state + CSS variable switching
├── routes/
│   ├── __root.tsx        # Root layout, CSS imports, Theme wrapper
│   └── index.tsx         # Home page
├── router.tsx
└── styles.css            # CSS custom properties for fonts
```

## Styling Rules

### No spacing props on text elements

Capsize normalizes text boxes to actual glyph bounds (no extra leading), so spacing between text elements must be controlled via `gap` on the parent container—not margins, padding, or line-height on the text itself.

```tsx
// ❌ DON'T - line-height hacks, margins, or padding on text
<Heading style={{ lineHeight: 1.3 }}>
<Heading mb="2">
<Heading pb="1">

// ✅ DO - use gap on parent Flex container
<Flex direction="column" gap="3">
  <Heading>Title</Heading>
  <Text>Content</Text>
</Flex>
```

### Spacing scale

Radix uses 1-9 scale:
- `gap="2"` - Tight (related items)
- `gap="3"` - Default
- `gap="4"` - Comfortable
- `gap="6"` - Section separation

### Avoid inline styles

Use Radix props instead of `style={{}}`. When unsure how to style something, look up the Radix docs at https://www.radix-ui.com/themes/docs

### State management (TanStack DB only)

Use TanStack DB for all state. For client-only UI state, use a local-only collection. Never use `useState`.

## Available Themes

| ID | Name | Fonts | Vibe |
|----|------|-------|------|
| inter | Inter | Inter | Clean & modern |
| source | Source Serif | Source Serif 4 + Source Sans 3 | Elegant editorial |
| alegreya | Alegreya | Alegreya + Alegreya Sans | Literary & warm |
| playfair | Playfair + Lato | Playfair Display + Lato | Classic craft |
| fraunces | Fraunces + Figtree | Fraunces + Figtree | Modern wonky |

Dozens more font pairings available. See https://github.com/KyleAMathews/vite-plugin-capsize-radix-ui/blob/main/SKILL.md for the full list.

## Adding Routes

Create new routes in `src/routes/`:

```tsx
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Container, Flex, Heading, Text } from '@radix-ui/themes'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="4">
        <Heading size="8">About</Heading>
        <Text>Your content here.</Text>
      </Flex>
    </Container>
  )
}
```

## Included Skills

Skills ship inside the library packages via `@tanstack/intent`. To list all available skills:

```bash
npx @tanstack/intent@latest list
```

<!-- intent-skills:start -->
# Skill mappings — when working in these areas, load the linked skill file into context.

### TanStack DB (`@tanstack/db`, `@tanstack/react-db`)

- **Setting up collections or adding a new data source** → `node_modules/@tanstack/db/skills/db-core/collection-setup/SKILL.md`
- **Writing live queries, filtering, joining, or aggregating data** → `node_modules/@tanstack/db/skills/db-core/live-queries/SKILL.md`
- **Mutations, optimistic updates, or server sync** → `node_modules/@tanstack/db/skills/db-core/mutations-optimistic/SKILL.md`
- **Building a custom collection adapter** → `node_modules/@tanstack/db/skills/db-core/custom-adapter/SKILL.md`
- **TanStack DB overview or general questions** → `node_modules/@tanstack/db/skills/db-core/SKILL.md`
- **Integrating DB with TanStack Start or other meta-frameworks** → `node_modules/@tanstack/db/skills/meta-framework/SKILL.md`
- **Using TanStack DB in React (useLiveQuery, hooks)** → `node_modules/@tanstack/react-db/skills/react-db/SKILL.md`
- **Offline support and transaction persistence** → `node_modules/@tanstack/offline-transactions/skills/offline/SKILL.md`

### Electric (`@electric-sql/client`)

- **Adding a new synced feature end-to-end** → `node_modules/@electric-sql/client/skills/electric-new-feature/SKILL.md`
- **Configuring shapes, ShapeStream, or sync options** → `node_modules/@electric-sql/client/skills/electric-shapes/SKILL.md`
- **Designing Postgres schema and shape definitions** → `node_modules/@electric-sql/client/skills/electric-schema-shapes/SKILL.md`
- **Using Electric with Drizzle or Prisma** → `node_modules/@electric-sql/client/skills/electric-orm/SKILL.md`
- **Debugging sync issues** → `node_modules/@electric-sql/client/skills/electric-debugging/SKILL.md`
- **Postgres security for Electric** → `node_modules/@electric-sql/client/skills/electric-postgres-security/SKILL.md`
- **Setting up auth proxy** → `node_modules/@electric-sql/client/skills/electric-proxy-auth/SKILL.md`
- **Deploying Electric** → `node_modules/@electric-sql/client/skills/electric-deployment/SKILL.md`

### Durable Streams (`@durable-streams/client`, `@durable-streams/state`)

- **Getting started with Durable Streams** → `node_modules/@durable-streams/client/skills/getting-started/SKILL.md`
- **Reading from streams (stream(), LiveMode, cursors)** → `node_modules/@durable-streams/client/skills/reading-streams/SKILL.md`
- **Writing data (append, IdempotentProducer)** → `node_modules/@durable-streams/client/skills/writing-data/SKILL.md`
- **Server deployment (dev server, Caddy)** → `node_modules/@durable-streams/client/skills/server-deployment/SKILL.md`
- **Production readiness checklist** → `node_modules/@durable-streams/client/skills/go-to-production/SKILL.md`
- **Defining state schemas** → `node_modules/@durable-streams/state/skills/state-schema/SKILL.md`
- **Stream-backed reactive database (createStreamDB)** → `node_modules/@durable-streams/state/skills/stream-db/SKILL.md`
<!-- intent-skills:end -->

## Skills

A skill is a set of local instructions in a `SKILL.md` file.

### Available skills

- `frontend-design` - Create distinctive, production-grade frontend interfaces with high design quality. (file: skills/frontend-design/SKILL.md)
