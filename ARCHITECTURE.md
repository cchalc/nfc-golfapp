# Architecture & Technical Reference

This document covers the technical implementation details of the Golf Trip Planner app. For features and usage, see [README.md](./README.md).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Routes    │  │ Components  │  │     TanStack DB         │  │
│  │  (TanStack  │──│  (Radix UI) │──│  (Reactive Collections) │  │
│  │   Router)   │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │
│                                                 │                │
│  ┌─────────────────────────────────────────────┴───────────────┐│
│  │                    Live Queries (IVM)                       ││
│  │         Sub-millisecond reactive updates via d2ts           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                    (Future: Electric SQL)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL (Neon)                           │
│                   Real-time sync to all clients                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Collections** define your data schema with Zod validation
2. **Live Queries** subscribe to data changes with incremental view maintenance
3. **Mutations** update data optimistically with automatic rollback on failure
4. **Scoring Library** calculates handicap strokes, net scores, and Stableford points

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | TanStack Start | Full-stack React with file-based routing |
| **UI** | Radix UI Themes | Accessible, themeable component library |
| **State** | TanStack DB | Reactive client-side collections with live queries |
| **Typography** | Capsize + Radix | Pixel-perfect font rendering with theme switching |
| **Validation** | Zod | Type-safe schema validation |
| **Sync** | Electric SQL (planned) | Real-time Postgres sync for multiplayer |
| **Build** | Vite | Fast dev server and optimized builds |

### Why TanStack DB?

- **Live Queries**: Data updates propagate instantly via differential dataflow
- **Optimistic Updates**: Changes appear immediately, rollback on error
- **Type Safety**: Full TypeScript support with schema inference
- **Local-First**: Works offline, syncs when connected (with Electric)

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── scoring/         # Scorecard, ScoreEntry, ScoreSummary
│   ├── leaderboards/    # LeaderboardTable
│   ├── trips/           # TripCard, TripForm
│   ├── golfers/         # GolferCard, GolferForm
│   └── ui/              # EmptyState, StatCard
├── db/
│   ├── collections.ts   # TanStack DB schemas & collections
│   └── seed.ts          # Sample data for development
├── lib/
│   └── scoring.ts       # Golf scoring calculations
└── routes/              # File-based routing
    ├── index.tsx        # Home dashboard
    ├── golfers/         # Golfer directory
    └── trips/           # Trip management
        └── $tripId/     # Individual trip views
            ├── rounds/  # Round & scorecard views
            ├── leaderboards.tsx
            └── teams.tsx
```

---

## Scoring System

### Handicap Allocation

Strokes are allocated based on stroke index (SI):
- **Handicap 1-18**: 1 stroke on holes where SI ≤ handicap
- **Handicap 19-36**: 2 strokes on SI 1-18 holes, 1 extra on SI ≤ (handicap - 18)
- **Handicap 37+**: Pattern continues

### Stableford Points

| Net Score vs Par | Points |
|------------------|--------|
| Double bogey+ | 0 |
| Bogey | 1 |
| Par | 2 |
| Birdie | 3 |
| Eagle | 4 |
| Albatross | 5 |

### Playing Handicap Formula

```
Course Handicap = Handicap Index × (Slope Rating / 113)
Playing Handicap = Course Handicap + (Course Rating - Par)
```

---

## Development Guide

### Commands

```bash
# Start dev server
pnpm dev

# Type check
pnpm tsc --noEmit

# Build for production
pnpm build
```

### Adding a New Route

Create a file in `src/routes/` - TanStack Router auto-generates the route tree.

```tsx
// src/routes/my-page.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-page')({
  ssr: false,  // Required for TanStack DB
  component: MyPage,
})

function MyPage() {
  return <div>Hello!</div>
}
```

### Adding a New Collection

```tsx
// src/db/collections.ts
export const mySchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const myCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (item) => item.id,
    schema: mySchema,
  })
)
```

### Using Live Queries

```tsx
import { useLiveQuery, eq } from '@tanstack/react-db'
import { golferCollection } from '../db/collections'

function MyComponent() {
  const { data: golfers } = useLiveQuery(
    (q) => q.from({ golfer: golferCollection })
           .where(({ golfer }) => eq(golfer.id, someId)),
    [someId]
  )

  return <div>{golfers?.map(g => g.name)}</div>
}
```

---

## Design System

### Theme Configuration

The app uses a "Clubhouse Luxury" theme:
- **Appearance**: Dark mode
- **Accent Color**: `grass` (forest green) for primary actions
- **Gray Color**: `sage` (green-tinted neutrals)
- **Gold Accents**: `amber` for highlights and trophies

### Typography

- **Headings**: Playfair Display (serif)
- **Body**: Lato (sans-serif)
- **Rendering**: Capsize for pixel-perfect text trimming

### Color Tokens

| Use Case | Radix Token |
|----------|-------------|
| Primary buttons | `grass-9` |
| Gold accents | `amber-9` |
| Background | `gray-1` |
| Surface | `gray-2` |
| Border | `gray-6` |
| Text | `gray-12` |

---

## Data Models

### Core Entities

- **Trip**: Golf trip with dates, location, participants
- **Golfer**: Player with handicap index and contact info
- **Round**: A round of golf on a specific course
- **Score**: Hole-by-hole scores with net and Stableford calculations
- **Team**: Groups of golfers for team competitions

### Relationships

```
Trip 1──* Round
Trip *──* Golfer (via TripGolfer)
Round 1──* Score
Golfer 1──* Score
Course 1──* Hole
Team *──* Golfer (via TeamMember)
```

---

## Roadmap

- [ ] **Challenges**: KP contests, longest drive, custom challenges
- [ ] **Electric Sync**: Multi-device real-time sync
- [ ] **Authentication**: Google OAuth + email/password
- [ ] **Mobile App**: React Native with shared logic
- [ ] **Course Database**: Import from golf course APIs
