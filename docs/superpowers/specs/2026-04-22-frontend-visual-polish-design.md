# Frontend Visual Polish Design

**Date**: 2026-04-22
**Scope**: Visual polish — keep current structure, improve aesthetics
**Approach**: Component library extraction with design token foundation

## Summary

Polish the Golf Trip Planner's visual presentation through:
- New reusable UI components (AnimatedList, Toast, MobileCard, etc.)
- Balanced animation system (~12 purposeful animations)
- Mobile-optimized scorecard entry and leaderboards
- Minimal empty states (action button only)
- Consolidated styling via CSS custom properties

Aesthetic direction: **Refined Current** — subtle evolution of the existing dark/grass theme with better spacing, softer borders, and subtle gradients.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Aesthetic | Refined Current | Evolution not revolution; polish what exists |
| Animation level | Balanced (~12) | Purposeful feedback without overwhelming golf data |
| Mobile priorities | Scorecard + Leaderboards | Where users spend time on the course |
| Empty states | Minimal | Just action button; trust users |
| Implementation | Component extraction | Maximum reusability, clean separation |

---

## Component Library

### New UI Components

Location: `src/components/ui/`

#### AnimatedList

Wraps children with staggered reveal animation.

```tsx
interface AnimatedListProps {
  children: React.ReactNode
  staggerMs?: number // default: 50
  animation?: 'fadeSlideUp' | 'fadeIn' // default: fadeSlideUp
}
```

Usage:
```tsx
<AnimatedList>
  {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
</AnimatedList>
```

#### Toast

Success/error notifications with auto-dismiss.

```tsx
interface ToastProps {
  message: string
  type: 'success' | 'error'
  duration?: number // default: 3000ms
  onDismiss: () => void
}
```

Positioning: Top-right on desktop, top-center on mobile. Enters with `toastSlide` animation.

Provide a `useToast` hook:
```tsx
const { showToast } = useToast()
showToast('Round saved', 'success')
```

#### MobileCard

Card-based alternative to table rows for mobile leaderboards.

```tsx
interface MobileCardProps {
  rank: number
  name: string
  score: string
  subtitle?: string // "HCP 8 • 4 rounds"
  highlight?: boolean // gold background for top 3
}
```

#### PageTransition

Wrapper for route transitions.

```tsx
interface PageTransitionProps {
  children: React.ReactNode
  animation?: 'fade' | 'slideUp' // default: fade
}
```

Wrap page content in routes. Uses CSS `animation` with `fadeSlideUp` keyframe.

#### LoadingButton

Button with spinner state during mutations.

```tsx
interface LoadingButtonProps extends Radix.ButtonProps {
  loading?: boolean
  loadingText?: string // shows instead of children when loading
}
```

### Enhanced Existing Components

#### EmptyState

Simplify to minimal version:

```tsx
// Before
interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

// After
interface EmptyStateProps {
  action: React.ReactNode
}
```

Renders centered action button only. No title, no description, no icon.

#### StatCard

Add hover interaction:
- `hoverLift` transition (2px translateY)
- Subtle gradient background: `var(--card-bg)`
- Border color transitions to `var(--grass-6)` on hover

#### Skeleton

Add `shimmer` animation variant alongside existing pulse.

### Scorecard Components

Location: `src/components/scoring/`

#### ScoreInput

Optimized number input for mobile.

```tsx
interface ScoreInputProps {
  value: number | null
  onChange: (value: number | null) => void
  par: number
  disabled?: boolean
}
```

Specs:
- Minimum size: 64px width × 48px height
- Input type: `tel` (brings up number pad on mobile)
- Visual feedback: border color changes based on score vs par

#### HoleNavigator

Swipeable hole navigation for mobile.

```tsx
interface HoleNavigatorProps {
  currentHole: number // 1-18
  onHoleChange: (hole: number) => void
  scores: (number | null)[] // for progress indication
}
```

Mobile: Horizontal scroll with CSS `scroll-snap-type: x mandatory` showing current hole prominently.
Desktop: Grid of 18 hole buttons (existing behavior).

#### GolferSwitcher

Swipe between golfers with progress.

```tsx
interface GolferSwitcherProps {
  golfers: Golfer[]
  currentIndex: number
  onIndexChange: (index: number) => void
}
```

Renders as full-width bar: `< Prev | Golfer 3 of 8 | Next >`
Prev/Next buttons for navigation (no swipe library needed).

---

## Animation System

### CSS Keyframes

Add to `styles.css`:

```css
/* Entry animations */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Feedback animations */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes checkmark {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Toast */
@keyframes toastSlide {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Mobile */
@keyframes swipeHint {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-8px); }
}
```

### CSS Transitions

Utility classes:

```css
.hover-lift {
  transition: transform var(--duration-normal) ease-out,
              box-shadow var(--duration-normal) ease-out;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-press:active {
  transform: scale(0.98);
}

.tab-indicator {
  transition: left var(--duration-normal) ease-out,
              width var(--duration-normal) ease-out;
}
```

### Stagger Utility

CSS custom property for stagger delays:

```css
.stagger-item {
  animation: fadeSlideUp var(--duration-slow) ease-out forwards;
  animation-delay: calc(var(--stagger-index, 0) * 50ms);
  opacity: 0;
}
```

Usage in React:
```tsx
{items.map((item, i) => (
  <div
    key={item.id}
    className="stagger-item"
    style={{ '--stagger-index': i } as React.CSSProperties}
  >
    {/* content */}
  </div>
))}
```

### Reduced Motion

All animations respect user preference:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Mobile Optimizations

### Breakpoint Strategy

Single breakpoint for simplicity:
- `< 640px`: Mobile layouts
- `≥ 640px`: Desktop layouts

```css
@media (max-width: 639px) {
  /* Mobile styles */
}
```

### Scorecard Mobile Layout

**GolferSwitcher** at top:
- Fixed position below header
- Full width
- Shows current golfer name + position (3 of 8)
- Prev/Next buttons or swipe

**HoleNavigator**:
- Horizontal scrollable row of hole numbers
- Current hole highlighted
- Completed holes show checkmark or score color
- Tap to jump, swipe to scroll

**Score Entry**:
- One hole at a time on mobile (vs. grid on desktop)
- Large centered input
- Par and hole info above
- HCP strokes shown as badge

**Front 9 / Back 9**:
- Tab buttons to switch between nines
- Clear visual break with section headers

### Leaderboard Mobile Layout

Below 640px, replace `LeaderboardTable` with `MobileCard` list:

```
┌────────────────────────────────┐
│ 🥇  1    John Smith      +12   │
│          HCP 8 • 4 rounds      │
├────────────────────────────────┤
│ 🥈  2    Jane Doe        +15   │
│          HCP 12 • 4 rounds     │
├────────────────────────────────┤
│ 🥉  3    Bob Wilson      +18   │
│          HCP 6 • 3 rounds      │
└────────────────────────────────┘
```

- Trophy emoji for top 3 (vs. icon on desktop)
- Score prominently on right
- Subtitle with handicap and round count
- Tap navigates to golfer detail page (same as desktop row click)

**Tabs**:
- Horizontally scrollable pill buttons
- Active tab has grass background
- Swipe to scroll tabs

---

## Styling Consolidation

### Design Tokens

Add to `styles.css` `:root`:

```css
:root {
  /* Spacing (mirrors Radix scale) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-9: 48px;

  /* Animation durations */
  --duration-fast: 0.1s;
  --duration-normal: 0.2s;
  --duration-slow: 0.3s;

  /* Easing */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Refined surface colors */
  --surface-1: var(--gray-1);
  --surface-2: var(--gray-2);
  --surface-3: var(--gray-3);

  /* Card styling */
  --card-bg: linear-gradient(135deg, var(--gray-2) 0%, var(--gray-1) 100%);
  --card-border: var(--gray-4);
  --card-border-hover: var(--grass-6);
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);

  /* Interactive */
  --focus-ring: 0 0 0 2px var(--grass-6);
}
```

### Inline Style Migration

Replace patterns like:
```tsx
// Before
<Text style={{ color: 'var(--grass-9)' }}>Score</Text>
<Box style={{ color: 'var(--amber-9)' }}>Trophy</Box>

// After
<Text color="grass">Score</Text>
<Box color="amber">Trophy</Box>
```

For custom gradients and shadows, use className with CSS:
```tsx
// Before
<Card style={{ background: 'linear-gradient(...)' }}>

// After
<Card className="card-elevated">
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ui/AnimatedList.tsx` | Staggered reveal wrapper |
| `src/components/ui/Toast.tsx` | Notification component |
| `src/components/ui/MobileCard.tsx` | Card for mobile leaderboards |
| `src/components/ui/PageTransition.tsx` | Route transition wrapper |
| `src/components/ui/LoadingButton.tsx` | Button with loading state |
| `src/components/scoring/ScoreInput.tsx` | Mobile-optimized score input |
| `src/components/scoring/HoleNavigator.tsx` | Swipeable hole navigation |
| `src/components/scoring/GolferSwitcher.tsx` | Swipe between golfers |
| `src/contexts/ToastContext.tsx` | Toast state management |
| `src/hooks/useToast.ts` | Toast hook |

## Files to Modify

| File | Changes |
|------|---------|
| `src/styles.css` | Add tokens, keyframes, utility classes |
| `src/components/ui/EmptyState.tsx` | Simplify to action-only |
| `src/components/ui/StatCard.tsx` | Add hover lift, gradient |
| `src/components/ui/Skeleton.tsx` | Add shimmer variant |
| `src/components/scoring/Scorecard.tsx` | Use new score components |
| `src/routes/trips/$tripId/leaderboards.tsx` | Add MobileCard view |
| `src/routes/trips/$tripId/rounds/$roundId/scorecard.tsx` | Mobile layout |
| `src/routes/__root.tsx` | Add ToastProvider, PageTransition |
| `src/components/trips/TripCard.tsx` | Replace inline color styles |
| `src/components/golfers/GolferCard.tsx` | Replace inline color styles |
| `src/components/courses/CourseCard.tsx` | Replace inline color styles |
| `src/components/leaderboards/LeaderboardTable.tsx` | Replace inline styles, add MobileCard |
| `src/components/scoring/ScoreEntry.tsx` | Replace inline styles |
| `src/routes/index.tsx` | Replace inline styles, add AnimatedList |
| `src/routes/trips/index.tsx` | Add AnimatedList |
| `src/routes/golfers/index.tsx` | Add AnimatedList |
| `src/routes/courses/index.tsx` | Add AnimatedList |

---

## Out of Scope

- Navigation restructuring (bottom nav, breadcrumbs on all pages)
- Form/dialog mobile optimization (keep existing Radix dialogs)
- New features or data model changes
- Performance optimizations
- Accessibility audit (beyond reduced-motion)
- Testing infrastructure
- Swipe gesture libraries (use CSS scroll-snap instead)

---

## Success Criteria

1. All list views use `AnimatedList` with staggered reveals
2. Mutations show toast feedback
3. Scorecard is comfortable to use on mobile (thumb-friendly)
4. Leaderboards render as cards on mobile
5. Empty states show only action button
6. No inline `style={}` props for colors (use Radix props or CSS)
7. All animations respect `prefers-reduced-motion`
8. Hover states feel responsive (lift, border changes)
