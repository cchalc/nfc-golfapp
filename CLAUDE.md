# Kyle's Stack

A starter for building apps with TanStack Start, Radix UI, and capsize typography.

## Shell Environment

- **Fish Shell Only**: This computer runs fish shell. Always use fish shell syntax, not bash/zsh.
- No `for x in ...; do ... done` - use `for x in ...; ...; end`
- No `$()` for command substitution in variable assignment - use `set VAR (command)`
- No `export VAR=value` - use `set -x VAR value`
- **No Homebrew**: Never use `brew` commands on this computer.
- **Jujutsu Only**: Use `jj` for version control, not `git` commands.

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
