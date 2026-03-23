# Golf Trip Planner

**Plan epic golf trips. Track every birdie. Crush your buddies on the leaderboard.**

A golf trip planning app with real-time score tracking, automatic handicap calculations, and live leaderboards. Built for golf crews who take their trips (and their trash talk) seriously.

---

## What You Can Do

### Plan Your Trip
- Create trips with dates, location, and description
- Invite your golf crew and manage participants
- Track multiple courses and rounds per trip

### Track Scores
- Full 18-hole scorecard with hole-by-hole entry
- Automatic net score calculation based on your handicap
- Stableford points calculated in real-time
- Front 9 / Back 9 totals and running scores

### Compete on Leaderboards
- **Stableford** - Total points across all rounds
- **Best Net** - Lowest net score
- **Birdies** - Who's making the most?
- **KPs** - Closest to the Pin tracking
- **Teams** - Create teams and track combined scores

### Run Challenges
- **Closest to Pin** - Track KP competitions on par 3s
- **Longest Drive** - Who's bombing it off the tee?
- **Custom Challenges** - Create your own competitions

### Manage Your Crew
- Keep a directory of all your golf buddies
- Track handicaps and contact info
- See each golfer's trip history and scoring stats

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the app
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and start planning.

**Sample data loads automatically** - you'll see a sample "Kelowna Golf Trip 2024" with golfers, courses, and scores to explore.

---

## Sample Trip

The app comes with data from a real Kelowna golf trip:

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

## Database

The app uses **Neon PostgreSQL** with **Drizzle ORM** for data persistence.

```fish
# Run migrations
just db-migrate

# Open database GUI
just db-studio

# Generate migration from schema changes
just db-generate
```

**Schema**: 13 tables with full foreign key relationships and `REPLICA IDENTITY FULL` for real-time sync.

---

## Coming Soon

- Multi-device sync (Electric SQL) - database ready with REPLICA IDENTITY FULL
- User accounts and authentication
- Mobile app
- Course database integration

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Tech stack, data models, scoring system, development guide |
| [TESTING.md](./TESTING.md) | Property-based testing with Bombadil, CI/CD integration |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Build process, deployment targets, environments |

---

## License

MIT

---

**Now go plan that trip. Your handicap isn't going to lower itself.**
