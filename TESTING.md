# Testing Guide

This document covers the testing strategy and tools for the Golf Trip Planner app.

---

## Overview

We use **Bombadil** for property-based testing of the web UI. Bombadil autonomously explores the application and validates that certain properties (invariants) always hold true, finding edge cases that traditional unit tests miss.

### Testing Philosophy

| Approach | Purpose | When to Use |
|----------|---------|-------------|
| **Property-Based** | Verify invariants hold across all states | Core business logic, UI consistency |
| **Exploratory** | Stress test with random interactions | Find edge cases, race conditions |
| **Chaos** | Long-running random exploration | Overnight discovery of rare bugs |

---

## Quick Start

```bash
# Install the Bombadil binary (macOS)
just bombadil-install

# Run quick tests (core invariants, <2 min)
just bombadil-quick

# Check for violations
just bombadil-report
```

---

## Test Categories

### Core Tests (`bombadil/specs/core/`)

Fast-running property tests that validate fundamental invariants. Run on every PR.

| Spec | Properties Tested | Duration |
|------|-------------------|----------|
| `scoring.spec.ts` | Net score calculation, Stableford points, handicap strokes | ~30s |
| `navigation.spec.ts` | Valid paths, no stuck loading, pages have headings | ~30s |
| `data-integrity.spec.ts` | Totals match sums, leaderboard sorted, ranks contiguous | ~30s |

### Workflow Tests (`bombadil/specs/workflows/`)

Standard-duration tests that explore complete user workflows. Run on main branch merges.

| Spec | Workflow Tested | Duration |
|------|-----------------|----------|
| `trip-lifecycle.spec.ts` | Trip creation, navigation, subpages | ~3 min |
| `round-scoring.spec.ts` | Score entry, state transitions, totals | ~5 min |
| `leaderboard.spec.ts` | Ranking, ties, filtering | ~3 min |
| `challenge-flow.spec.ts` | Challenge CRUD, scope validation | ~2 min |

### Exploratory Tests (`bombadil/specs/exploratory/`)

Long-running chaos tests that stress-test the application. Run nightly.

| Spec | Focus | Duration |
|------|-------|----------|
| `chaos-scoring.spec.ts` | Rapid score entry, race conditions | 1-8 hours |
| `edge-cases.spec.ts` | Boundary conditions, empty states | 1-8 hours |

---

## Properties Tested

### Scoring Invariants (Always Hold)

```typescript
// Net = Gross - Handicap Strokes
netScoreCalculation = always(() => {
  for (score of allHoleScores) {
    if (score.netScore !== score.grossScore - score.handicapStrokes) return false
  }
  return true
})

// Stableford follows standard mapping
stablefordPointsCorrect = always(() => {
  diff = netScore - par
  if (diff >= 2) points = 0      // Double bogey+
  if (diff === 1) points = 1     // Bogey
  if (diff === 0) points = 2     // Par
  if (diff === -1) points = 3    // Birdie
  if (diff === -2) points = 4    // Eagle
  if (diff <= -3) points = 5     // Albatross
})

// Handicap strokes are valid (0-3 per hole for max 54 handicap)
handicapStrokesValid = always(() => score.handicapStrokes >= 0 && <= 3)

// Gross scores in valid range
grossScoreRange = always(() => score.grossScore >= 1 && <= 15)
```

### Leaderboard Invariants

```typescript
// Sorted by rank
leaderboardSorted = always(() => ranks are in ascending order)

// Ties have same rank
tiedRanksConsistent = always(() => same score = same rank)

// No gaps in ranks (1, 2, 2, 4 is valid; 1, 2, 5 is not)
ranksContiguous = always(() => no gaps except for ties)

// Leader has best score
leaderHasBestValue = always(() => rank 1 has highest/lowest value)
```

### Navigation Invariants

```typescript
// Valid path format
validPathFormat = always(() => path.startsWith('/'))

// No stuck loading
loadingEventuallyCompletes = always(() => eventually(!isLoading))

// Pages have headings (accessibility)
pageHasHeading = always(() => visibleHeadings.length > 0)
```

---

## Architecture

### Directory Structure

```
bombadil/
├── specs/                    # Test specifications
│   ├── core/                 # Quick tests (<2 min)
│   ├── workflows/            # Standard tests (5-15 min)
│   └── exploratory/          # Overnight tests (hours)
├── extractors/               # State extraction from DOM
│   ├── scoring.ts            # Hole scores, totals
│   ├── navigation.ts         # Path, loading, errors
│   └── leaderboard.ts        # Entries, ranks
├── generators/               # Action generation
│   ├── navigation.ts         # Browser navigation
│   ├── score-entry.ts        # Score input
│   └── forms.ts              # Form filling
├── fixtures/                 # Test data
│   ├── constants.ts          # Golf scoring constants
│   ├── golfers.ts            # Test golfer generators
│   └── courses.ts            # Test course data
└── state-machines/           # State transition definitions
    └── round-states.ts       # Round scoring states
```

### Extractors

Extractors query the DOM using `data-testid` attributes and return reactive `Cell<T>` values:

```typescript
// Extract all hole scores from the scorecard
export const allHoleScores = extract((state) => {
  const scores = []
  for (let i = 1; i <= 18; i++) {
    const grossEl = state.document.querySelector(`[data-testid="gross-score-${i}"]`)
    // ... extract score data
    scores.push({ holeNumber: i, grossScore, netScore, ... })
  }
  return scores
})
```

### Generators

Generators produce arrays of possible actions for Bombadil to take:

```typescript
export const enterRandomScores = actions(() => {
  const result: Action[] = []
  for (const score of allHoleScores.current) {
    const randomScore = Math.floor(Math.random() * 15) + 1
    result.push({
      TypeText: { text: randomScore.toString(), delayMillis: 50 }
    })
  }
  return result
})
```

### Data-testid Attributes

Components use `data-testid` for reliable DOM querying:

| Component | Attributes |
|-----------|------------|
| `ScoreEntry.tsx` | `score-entry-hole-{n}`, `gross-score-{n}`, `net-score-{n}`, `stableford-points-{n}` |
| `Scorecard.tsx` | `front-nine`, `back-nine`, `front-nine-gross`, etc. |
| `LeaderboardTable.tsx` | `leaderboard-row-{id}`, `rank-{id}`, `golfer-name-{id}`, `score-value-{id}` |

---

## Running Tests

### Local Commands (justfile)

```bash
# Install bombadil binary
just bombadil-install

# Run core tests (<2 min)
just bombadil-quick

# Run full suite (15-20 min)
just bombadil-full

# Run exploratory tests (1 hour default)
just bombadil-explore

# Run with custom duration (in seconds)
just bombadil-explore 7200

# Run a single spec
just bombadil-spec bombadil/specs/core/scoring.spec.ts

# Generate violation report
just bombadil-report

# Check for violations (exit code 1 if found)
just bombadil-check-violations

# Clean up results
just bombadil-clean

# Watch mode (re-run on changes)
just bombadil-watch
```

### Manual Bombadil Commands

```bash
# Run a spec directly
bombadil test http://localhost:5173 bombadil/specs/core/scoring.spec.ts \
  --max-steps 100 \
  --timeout 120 \
  --output-path ./bombadil-results/manual

# View violations in trace
jq -r 'select(.violations != []) | {url, violations}' bombadil-results/manual/trace.jsonl
```

---

## CI/CD Integration

### GitHub Actions Workflows

| Workflow | Trigger | Duration | Purpose |
|----------|---------|----------|---------|
| `bombadil-quick.yml` | Pull requests | <10 min | Catch regressions before merge |
| `bombadil-full.yml` | Push to main | ~45 min | Full validation after merge |
| `bombadil-nightly.yml` | Cron 2 AM UTC | 8 hours | Deep exploratory testing |

### Workflow: bombadil-quick.yml (PRs)

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - 'bombadil/**'

jobs:
  quick-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: curl -L -o bombadil https://github.com/antithesishq/bombadil/releases/download/v0.3.2/bombadil-x86_64-linux
      - run: chmod +x bombadil && sudo mv bombadil /usr/local/bin/
      - run: pnpm dev &
      - run: bombadil test http://localhost:5173 bombadil/specs/core/*.spec.ts
```

### Nightly Violations

The nightly workflow automatically creates GitHub issues when violations are found:

```
## Bombadil Nightly Test Violations

Found 3 state(s) with property violations.

### Violations Summary
- **URL:** /trips/abc123/scorecard?golferId=xyz
  - Violations: netScoreCalculation, stablefordPointsCorrect
```

---

## Design Decisions

### Why Property-Based Testing?

Traditional unit tests verify specific scenarios. Property-based tests verify that invariants hold across *all* possible states, finding edge cases automatically.

**Example**: Instead of testing "entering 4 on a par 4 gives 2 Stableford points", we test "for any valid score on any hole, the Stableford points follow the standard mapping."

### Why Bombadil?

- **Autonomous exploration**: Discovers UI states we didn't think to test
- **Temporal properties**: Can test "eventually" and "always" conditions
- **Parallel execution**: Multiple specs can run concurrently
- **CI/CD integration**: Easy to add to GitHub Actions

### Why data-testid?

- **Stable selectors**: Don't break when CSS classes change
- **Semantic meaning**: Clear intent for test code
- **Performance**: Fast DOM queries
- **Separation**: Test infrastructure doesn't pollute production code

---

## Debugging Failures

### Reading Trace Files

```bash
# Find violations
jq -r 'select(.violations != []) | .url' bombadil-results/quick/trace.jsonl

# Get full violation details
jq -r 'select(.violations != []) | {url, violations, actions}' bombadil-results/quick/trace.jsonl
```

### Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "extractors return null" | Missing `data-testid` | Add attribute to component |
| "property always false" | Extractor logic error | Debug with console.log in extractor |
| "timeout exceeded" | Dev server slow | Increase `--timeout` flag |
| "no actions generated" | Generator condition false | Check extractor values |

### Adding console.log to Extractors

Temporarily add logging for debugging:

```typescript
export const allHoleScores = extract((state) => {
  const scores = []
  console.log('Extracting scores...')
  // ... rest of extractor
  console.log('Found scores:', scores)
  return scores
})
```

---

## Adding New Tests

### 1. Add data-testid to Component

```tsx
// src/components/MyComponent.tsx
<div data-testid="my-component">
  <span data-testid="my-value">{value}</span>
</div>
```

### 2. Create Extractor

```typescript
// bombadil/extractors/my-feature.ts
import { extract } from '@antithesishq/bombadil'

export const myValue = extract((state) => {
  const el = state.document.querySelector('[data-testid="my-value"]')
  return el?.textContent || ''
})
```

### 3. Write Property

```typescript
// bombadil/specs/core/my-feature.spec.ts
import { always } from '@antithesishq/bombadil'
import { myValue } from '../../extractors/my-feature'

export * from '@antithesishq/bombadil/defaults'

export const myValueIsValid = always(() => {
  const value = myValue.current
  return value.length > 0 && value.length < 100
})
```

### 4. Test Locally

```bash
just bombadil-spec bombadil/specs/core/my-feature.spec.ts
```

---

## References

- [Bombadil Documentation](https://antithesishq.github.io/bombadil/)
- [Bombadil GitHub](https://github.com/antithesishq/bombadil)
- [Property-Based Testing Intro](https://antithesishq.github.io/bombadil/3-specification-language.html)
