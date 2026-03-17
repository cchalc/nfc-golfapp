# Golf Trip Planner

**Plan epic golf trips. Track every birdie. Crush your buddies on the leaderboard.**

A local-first golf trip planning app with real-time score tracking, automatic handicap calculations, and live leaderboards. Built for golf crews who take their trips (and their trash talk) seriously.

---

## Features

### Plan Your Trip
- Create trips with dates, location, and description
- Invite your golf crew and manage participants
- Track multiple courses and rounds per trip

### Score Like a Pro
- Full 18-hole scorecard with hole-by-hole entry
- **Automatic net score calculation** based on playing handicap
- **Stableford points** calculated in real-time
- Handicap strokes allocated by stroke index
- Front 9 / Back 9 totals

### Compete on Leaderboards
- **Stableford** - Total points across all rounds
- **Best Net** - Lowest net score
- **Birdies** - Who's making the most?
- **KPs** - Closest to the Pin tracking
- **Teams** - Create teams and track aggregate scores

### Manage Teams
- Create teams with custom colors
- Drag-and-drop member assignment
- Live team leaderboard

---

## Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd nfc-golfapp

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and start planning your next trip.

**Sample data loads automatically** on first run - you'll see the "Kelowna Golf Trip 2024" with 10 golfers, 4 courses, and historical scores to explore.

---

## Architecture

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

| Layer | Technology | Why |
|-------|------------|-----|
| **Framework** | TanStack Start | Full-stack React with file-based routing |
| **UI** | Radix UI Themes | Accessible, beautiful components out of the box |
| **State** | TanStack DB | Reactive client-side collections with live queries |
| **Styling** | Capsize + CSS Variables | Pixel-perfect typography with theme switching |
| **Validation** | Zod | Type-safe schema validation |
| **Sync** | Electric SQL (planned) | Real-time Postgres sync for multiplayer |
| **Build** | Vite | Lightning-fast dev server and builds |

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

### Playing Handicap

```
Course Handicap = Handicap Index × (Slope Rating / 113)
Playing Handicap = Course Handicap + (Course Rating - Par)
```

---

## Sample Data

The app seeds with data from a real Kelowna golf trip:

**Golfers**: Seef, Sefie, Graham, Peter, Albert, Sean, Chris Cox, Chris Chalcraft, Steve, Aussie Matt

**Courses**:
- Gallagher's Canyon
- Okanagan Bear
- Okanagan Quail
- Tower Ranch

**Teams**:
- Team 1 (Red)
- Team 2 (Blue)

---

## Development

```bash
# Start dev server
pnpm dev

# Type check
pnpm check

# Lint & format
pnpm lint
pnpm format
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

---

## Roadmap

- [ ] **Challenges**: KP contests, longest drive, custom challenges
- [ ] **Electric Sync**: Multi-device real-time sync
- [ ] **Authentication**: Google OAuth + email/password
- [ ] **Mobile App**: React Native with shared logic
- [ ] **Course Database**: Import from golf course APIs

---

## Built With

This project uses [Kyle's Stack](https://github.com/KyleAMathews/kyles-stack) as a foundation, enhanced with:
- TanStack DB for reactive state
- Custom scoring algorithms
- Golf-specific UI components

---

## License

MIT

---

**Now go plan that trip. Your handicap isn't going to lower itself.**
