# Frontend Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Golf Trip Planner's visual presentation with reusable UI components, animations, and mobile optimizations.

**Architecture:** Component library extraction approach — build reusable components first (Toast, AnimatedList, MobileCard), then integrate them into existing pages. CSS foundation with design tokens enables consistent styling.

**Tech Stack:** React, TypeScript, Radix UI, TanStack Router, CSS custom properties

---

## File Structure

### New Files
```
src/
├── components/ui/
│   ├── AnimatedList.tsx      # Staggered reveal wrapper
│   ├── Toast.tsx             # Notification component
│   ├── MobileCard.tsx        # Card for mobile leaderboards
│   ├── PageTransition.tsx    # Route transition wrapper
│   └── LoadingButton.tsx     # Button with loading state
├── components/scoring/
│   ├── ScoreInput.tsx        # Mobile-optimized score input
│   ├── HoleNavigator.tsx     # Hole navigation (scroll-snap on mobile)
│   └── GolferSwitcher.tsx    # Prev/Next golfer bar
├── contexts/
│   └── ToastContext.tsx      # Toast state management
└── hooks/
    └── useToast.ts           # Toast hook
```

### Modified Files
```
src/
├── styles.css                # Design tokens, keyframes, utilities
├── components/ui/
│   ├── EmptyState.tsx        # Simplify to action-only
│   ├── StatCard.tsx          # Add hover lift
│   └── Skeleton.tsx          # Add shimmer variant
├── components/
│   ├── trips/TripCard.tsx    # Remove inline styles
│   ├── golfers/GolferCard.tsx
│   ├── courses/CourseCard.tsx
│   └── leaderboards/LeaderboardTable.tsx  # Add MobileCard view
├── routes/
│   ├── __root.tsx            # Add ToastProvider
│   ├── trips/index.tsx       # Add AnimatedList
│   ├── golfers/index.tsx     # Add AnimatedList
│   ├── courses/index.tsx     # Add AnimatedList
│   └── trips/$tripId/
│       ├── leaderboards.tsx  # Use MobileCard
│       └── rounds/$roundId/scorecard.tsx  # Mobile layout
```

---

## Task 1: CSS Foundation — Design Tokens and Animations

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add design tokens to :root**

Add after line 4 (after `--body-font`):

```css
  /* Design tokens */
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

  /* Card styling */
  --card-bg: linear-gradient(135deg, var(--gray-2) 0%, var(--gray-1) 100%);
  --card-border: var(--gray-4);
  --card-border-hover: var(--grass-6);
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);

  /* Interactive */
  --focus-ring: 0 0 0 2px var(--grass-6);
```

- [ ] **Step 2: Add new keyframes**

Add after the existing `@keyframes spin` block (around line 262):

```css
/* Scale in for dialogs */
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

/* Shake for errors */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* Pulse for loading */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Checkmark success */
@keyframes checkmark {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Toast slide in */
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

/* Toast slide in mobile (from top) */
@keyframes toastSlideTop {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Add utility classes**

Add at the end of the file:

```css
/* Hover lift utility */
.hover-lift {
  transition: transform var(--duration-normal) ease-out,
              box-shadow var(--duration-normal) ease-out;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

/* Button press effect */
.button-press:active {
  transform: scale(0.98);
}

/* Stagger animation item */
.stagger-item {
  animation: fadeSlideUp var(--duration-slow) ease-out forwards;
  animation-delay: calc(var(--stagger-index, 0) * 50ms);
  opacity: 0;
}

/* Icon color utility */
.icon-grass {
  color: var(--grass-9);
}

.icon-amber {
  color: var(--amber-9);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .stagger-item,
  .animate-reveal,
  .animate-reveal-1,
  .animate-reveal-2,
  .animate-reveal-3,
  .animate-reveal-4 {
    animation: none;
    opacity: 1;
  }

  .hover-lift:hover {
    transform: none;
  }
}
```

- [ ] **Step 4: Verify CSS is valid**

Run: `pnpm build`
Expected: Build succeeds without CSS errors

- [ ] **Step 5: Commit**

```bash
jj new -m "feat: add CSS design tokens, animations, and utility classes"
```

---

## Task 2: Toast System — Context and Hook

**Files:**
- Create: `src/contexts/ToastContext.tsx`
- Create: `src/hooks/useToast.ts`

- [ ] **Step 1: Create ToastContext**

```tsx
// src/contexts/ToastContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface ToastData {
  id: string
  message: string
  type: 'success' | 'error'
  duration: number
}

interface ToastContextValue {
  toasts: ToastData[]
  showToast: (message: string, type: 'success' | 'error', duration?: number) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error', duration = 3000) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type, duration }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider')
  }
  return context
}
```

- [ ] **Step 2: Create useToast hook**

```tsx
// src/hooks/useToast.ts
import { useToastContext } from '../contexts/ToastContext'

export function useToast() {
  const { showToast } = useToastContext()
  return { showToast }
}
```

- [ ] **Step 3: Verify files compile**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add ToastContext and useToast hook"
```

---

## Task 3: Toast Component

**Files:**
- Create: `src/components/ui/Toast.tsx`

- [ ] **Step 1: Create Toast component**

```tsx
// src/components/ui/Toast.tsx
import { Flex, Text, IconButton } from '@radix-ui/themes'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { useToastContext, type ToastData } from '../../contexts/ToastContext'

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const Icon = toast.type === 'success' ? CheckCircle : AlertCircle
  const color = toast.type === 'success' ? 'var(--grass-9)' : 'var(--red-9)'

  return (
    <Flex
      align="center"
      gap="2"
      p="3"
      style={{
        background: 'var(--gray-2)',
        border: '1px solid var(--gray-4)',
        borderRadius: '8px',
        boxShadow: 'var(--card-shadow-hover)',
        animation: 'toastSlide var(--duration-slow) ease-out',
      }}
    >
      <Icon size={18} style={{ color, flexShrink: 0 }} />
      <Text size="2" style={{ flex: 1 }}>
        {toast.message}
      </Text>
      <IconButton size="1" variant="ghost" color="gray" onClick={onDismiss}>
        <X size={14} />
      </IconButton>
    </Flex>
  )
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToastContext()

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '360px',
        width: '100%',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add Toast component"
```

---

## Task 4: AnimatedList Component

**Files:**
- Create: `src/components/ui/AnimatedList.tsx`

- [ ] **Step 1: Create AnimatedList component**

```tsx
// src/components/ui/AnimatedList.tsx
import { Children, type ReactNode, type CSSProperties } from 'react'

interface AnimatedListProps {
  children: ReactNode
  staggerMs?: number
  className?: string
}

export function AnimatedList({ children, staggerMs = 50, className }: AnimatedListProps) {
  return (
    <>
      {Children.map(children, (child, index) => (
        <div
          className={`stagger-item ${className || ''}`}
          style={{ '--stagger-index': index } as CSSProperties}
        >
          {child}
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add AnimatedList component"
```

---

## Task 5: LoadingButton Component

**Files:**
- Create: `src/components/ui/LoadingButton.tsx`

- [ ] **Step 1: Create LoadingButton component**

```tsx
// src/components/ui/LoadingButton.tsx
import { Button, Spinner, type ButtonProps } from '@radix-ui/themes'
import { type ReactNode } from 'react'

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  children: ReactNode
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} disabled={disabled || loading} className="button-press">
      {loading ? (
        <>
          <Spinner size="1" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add LoadingButton component"
```

---

## Task 6: MobileCard Component

**Files:**
- Create: `src/components/ui/MobileCard.tsx`

- [ ] **Step 1: Create MobileCard component**

```tsx
// src/components/ui/MobileCard.tsx
import { Card, Flex, Text } from '@radix-ui/themes'
import { type ReactNode } from 'react'

interface MobileCardProps {
  rank: number
  name: string
  score: string
  subtitle?: string
  highlight?: boolean
  onClick?: () => void
  leftSlot?: ReactNode
}

function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

export function MobileCard({
  rank,
  name,
  score,
  subtitle,
  highlight = false,
  onClick,
  leftSlot,
}: MobileCardProps) {
  const emoji = getRankEmoji(rank)

  return (
    <Card
      className="hover-lift"
      style={{
        cursor: onClick ? 'pointer' : undefined,
        background: highlight ? 'var(--grass-2)' : undefined,
        borderColor: highlight ? 'var(--grass-6)' : undefined,
      }}
      onClick={onClick}
    >
      <Flex align="center" gap="3" p="1">
        <Flex align="center" gap="2" style={{ minWidth: '48px' }}>
          {emoji && <Text size="4">{emoji}</Text>}
          {leftSlot}
          <Text weight="bold" color={rank > 3 ? 'gray' : undefined}>
            {rank}
          </Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <Text weight="medium" truncate>
            {name}
          </Text>
          {subtitle && (
            <Text size="1" color="gray">
              {subtitle}
            </Text>
          )}
        </Flex>

        <Text
          weight="bold"
          size="4"
          color={highlight ? 'amber' : undefined}
          style={{ flexShrink: 0 }}
        >
          {score}
        </Text>
      </Flex>
    </Card>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add MobileCard component for mobile leaderboards"
```

---

## Task 7: PageTransition Component

**Files:**
- Create: `src/components/ui/PageTransition.tsx`

- [ ] **Step 1: Create PageTransition component**

```tsx
// src/components/ui/PageTransition.tsx
import { type ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return <div className="animate-reveal">{children}</div>
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add PageTransition component"
```

---

## Task 8: Simplify EmptyState

**Files:**
- Modify: `src/components/ui/EmptyState.tsx`

- [ ] **Step 1: Replace EmptyState with minimal version**

Replace entire file content:

```tsx
// src/components/ui/EmptyState.tsx
import { Flex } from '@radix-ui/themes'
import { type ReactNode } from 'react'

interface EmptyStateProps {
  action: ReactNode
}

export function EmptyState({ action }: EmptyStateProps) {
  return (
    <Flex direction="column" align="center" py="9">
      {action}
    </Flex>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build fails — usages need updating

- [ ] **Step 3: Update trips/index.tsx usage**

In `src/routes/trips/index.tsx`, change line 65-76 from:

```tsx
          <EmptyState
            title="No trips yet"
            description="Create your first golf trip to get started"
            action={
              <Link to="/trips/new">
                <Button color="grass">
                  <Plus size={16} />
                  Create Trip
                </Button>
              </Link>
            }
          />
```

To:

```tsx
          <EmptyState
            action={
              <Link to="/trips/new">
                <Button color="grass">
                  <Plus size={16} />
                  Create Trip
                </Button>
              </Link>
            }
          />
```

- [ ] **Step 4: Find and update all other EmptyState usages**

Run: `grep -rn "EmptyState" src/routes src/components --include="*.tsx" | grep -v "import"`

Update each usage to remove `title` and `description` props.

- [ ] **Step 5: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
jj new -m "refactor: simplify EmptyState to action-only"
```

---

## Task 9: Enhance StatCard with Hover

**Files:**
- Modify: `src/components/ui/StatCard.tsx`

- [ ] **Step 1: Add hover-lift class to StatCard**

Replace entire file:

```tsx
// src/components/ui/StatCard.tsx
import { Card, Flex, Text, Heading } from '@radix-ui/themes'

interface StatCardProps {
  label: string
  value: string | number
  color?: 'gray' | 'grass' | 'green' | 'red' | 'amber'
}

export function StatCard({ label, value, color = 'gray' }: StatCardProps) {
  return (
    <Card className="hover-lift">
      <Flex direction="column" gap="2">
        <Text size="1" color="gray">
          {label}
        </Text>
        <Heading size="6" color={color}>
          {value}
        </Heading>
      </Flex>
    </Card>
  )
}
```

- [ ] **Step 2: Update any usages that pass goldAccent**

Run: `grep -rn "goldAccent" src/ --include="*.tsx"`

If found, remove the prop from call sites.

- [ ] **Step 3: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
jj new -m "refactor: enhance StatCard with hover-lift animation"
```

---

## Task 10: Integrate Toast into Root

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Add ToastProvider and ToastContainer imports**

Add after line 15:

```tsx
import { ToastProvider } from '../contexts/ToastContext'
import { ToastContainer } from '../components/ui/Toast'
```

- [ ] **Step 2: Wrap content with ToastProvider and add ToastContainer**

Change RootComponent (lines 67-94) to:

```tsx
function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Theme appearance="dark" accentColor="grass" grayColor="sage" radius="medium">
          <ErrorBoundary>
            <ClientOnly>
              <QueryProvider>
                <AuthProvider>
                  <ThemeProvider>
                    <ToastProvider>
                      <DataLoader>
                        <Header />
                        <Outlet />
                      </DataLoader>
                      <ToastContainer />
                    </ToastProvider>
                  </ThemeProvider>
                </AuthProvider>
              </QueryProvider>
            </ClientOnly>
          </ErrorBoundary>
        </Theme>
        <Scripts />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: integrate Toast system into root layout"
```

---

## Task 11: Add AnimatedList to Trips Page

**Files:**
- Modify: `src/routes/trips/index.tsx`

- [ ] **Step 1: Add AnimatedList import**

Add after line 6:

```tsx
import { AnimatedList } from '../../components/ui/AnimatedList'
```

- [ ] **Step 2: Wrap trip cards with AnimatedList**

Change lines 54-63 from:

```tsx
        {trips && trips.length > 0 ? (
          <Flex direction="column" gap="3">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                golferCount={golferCountByTrip.get(trip.id) || 0}
              />
            ))}
          </Flex>
```

To:

```tsx
        {trips && trips.length > 0 ? (
          <Flex direction="column" gap="3">
            <AnimatedList>
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  golferCount={golferCountByTrip.get(trip.id) || 0}
                />
              ))}
            </AnimatedList>
          </Flex>
```

- [ ] **Step 3: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add staggered reveal animation to trips list"
```

---

## Task 12: Add AnimatedList to Golfers and Courses Pages

**Files:**
- Modify: `src/routes/golfers/index.tsx`
- Modify: `src/routes/courses/index.tsx`

- [ ] **Step 1: Read golfers/index.tsx to understand structure**

Run: `head -60 src/routes/golfers/index.tsx`

- [ ] **Step 2: Add AnimatedList import to golfers/index.tsx**

Add import for AnimatedList from `../../components/ui/AnimatedList`

- [ ] **Step 3: Wrap golfer cards with AnimatedList**

Find the map over golfers and wrap with `<AnimatedList>...</AnimatedList>`

- [ ] **Step 4: Repeat for courses/index.tsx**

Add AnimatedList import and wrap course cards.

- [ ] **Step 5: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
jj new -m "feat: add staggered reveal animation to golfers and courses lists"
```

---

## Task 13: Remove Inline Styles from TripCard

**Files:**
- Modify: `src/components/trips/TripCard.tsx`

- [ ] **Step 1: Replace inline icon styles with CSS class**

Change lines 49, 57, 65 from:

```tsx
              <Calendar size={14} style={{ color: 'var(--grass-9)' }} />
```

To:

```tsx
              <Calendar size={14} className="icon-grass" />
```

Do the same for `MapPin` and `Users` icons.

- [ ] **Step 2: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "refactor: remove inline styles from TripCard"
```

---

## Task 14: Remove Inline Styles from LeaderboardTable

**Files:**
- Modify: `src/components/leaderboards/LeaderboardTable.tsx`

- [ ] **Step 1: Replace inline style on leader score**

Change line 135 from:

```tsx
                  style={isLeader ? { color: 'var(--amber-9)' } : undefined}
```

To:

```tsx
                  color={isLeader ? 'amber' : undefined}
```

- [ ] **Step 2: Replace inline cursor styles**

Change line 103 from:

```tsx
                    <Flex align="center" gap="2" style={{ cursor: 'pointer' }}>
```

To:

```tsx
                    <Flex align="center" gap="2">
```

(Link already provides pointer cursor)

Change line 125 from:

```tsx
                    style={onClickRounds ? { cursor: 'pointer' } : undefined}
```

To just remove the style prop entirely (Badge is clickable when onClick is provided).

- [ ] **Step 3: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
jj new -m "refactor: remove inline styles from LeaderboardTable"
```

---

## Task 15: Add MobileCard View to LeaderboardTable

**Files:**
- Modify: `src/components/leaderboards/LeaderboardTable.tsx`

- [ ] **Step 1: Add MobileCard import and mobile detection**

Add after line 3:

```tsx
import { MobileCard } from '../ui/MobileCard'
```

- [ ] **Step 2: Add useMediaQuery hook inline**

Add after the imports:

```tsx
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}
```

Add `useState, useEffect` to React imports.

- [ ] **Step 3: Add mobile view rendering**

Inside LeaderboardTable function, add at the top:

```tsx
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Flex direction="column" gap="2">
        {entries.map((entry) => {
          const isExcluded = entry.included === false
          return (
            <MobileCard
              key={entry.golferId}
              rank={isExcluded ? 0 : entry.rank}
              name={entry.name}
              score={entry.displayValue}
              subtitle={showRounds ? `${entry.rounds} rounds` : undefined}
              highlight={entry.rank === 1 && !isExcluded}
              onClick={() => {
                window.location.href = `/golfers/${entry.golferId}`
              }}
            />
          )
        })}
      </Flex>
    )
  }
```

- [ ] **Step 4: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Test on mobile viewport**

Run: `pnpm dev`
Open browser, resize to < 640px width, navigate to leaderboards.
Expected: See card-based layout instead of table.

- [ ] **Step 6: Commit**

```bash
jj new -m "feat: add MobileCard view to leaderboards on mobile"
```

---

## Task 16: Scorecard Components — ScoreInput

**Files:**
- Create: `src/components/scoring/ScoreInput.tsx`

- [ ] **Step 1: Create ScoreInput component**

```tsx
// src/components/scoring/ScoreInput.tsx
import { TextField } from '@radix-ui/themes'
import { type ChangeEvent } from 'react'

interface ScoreInputProps {
  value: number | null
  onChange: (value: number | null) => void
  par: number
  disabled?: boolean
}

function getScoreColor(score: number | null, par: number): string | undefined {
  if (score === null) return undefined
  if (score < par) return 'var(--grass-9)' // Under par (birdie or better)
  if (score === par) return undefined // Par
  if (score === par + 1) return 'var(--amber-9)' // Bogey
  return 'var(--red-9)' // Double bogey or worse
}

export function ScoreInput({ value, onChange, par, disabled = false }: ScoreInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '') {
      onChange(null)
    } else {
      const num = parseInt(val, 10)
      if (!isNaN(num) && num >= 1 && num <= 20) {
        onChange(num)
      }
    }
  }

  const borderColor = getScoreColor(value, par)

  return (
    <TextField.Root
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value ?? ''}
      onChange={handleChange}
      disabled={disabled}
      size="3"
      style={{
        width: '64px',
        textAlign: 'center',
        borderColor: borderColor,
      }}
    />
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add ScoreInput component with mobile optimization"
```

---

## Task 17: Scorecard Components — GolferSwitcher

**Files:**
- Create: `src/components/scoring/GolferSwitcher.tsx`

- [ ] **Step 1: Create GolferSwitcher component**

```tsx
// src/components/scoring/GolferSwitcher.tsx
import { Flex, Text, IconButton } from '@radix-ui/themes'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Golfer {
  id: string
  name: string
}

interface GolferSwitcherProps {
  golfers: Golfer[]
  currentIndex: number
  onIndexChange: (index: number) => void
}

export function GolferSwitcher({ golfers, currentIndex, onIndexChange }: GolferSwitcherProps) {
  const currentGolfer = golfers[currentIndex]
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < golfers.length - 1

  return (
    <Flex
      align="center"
      justify="between"
      p="3"
      style={{
        background: 'var(--gray-2)',
        borderRadius: '8px',
        border: '1px solid var(--gray-4)',
      }}
    >
      <IconButton
        variant="ghost"
        color="gray"
        disabled={!canGoPrev}
        onClick={() => onIndexChange(currentIndex - 1)}
      >
        <ChevronLeft size={20} />
      </IconButton>

      <Flex direction="column" align="center" gap="1">
        <Text weight="medium">{currentGolfer?.name}</Text>
        <Text size="1" color="gray">
          {currentIndex + 1} of {golfers.length}
        </Text>
      </Flex>

      <IconButton
        variant="ghost"
        color="gray"
        disabled={!canGoNext}
        onClick={() => onIndexChange(currentIndex + 1)}
      >
        <ChevronRight size={20} />
      </IconButton>
    </Flex>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add GolferSwitcher component"
```

---

## Task 18: Scorecard Components — HoleNavigator

**Files:**
- Create: `src/components/scoring/HoleNavigator.tsx`

- [ ] **Step 1: Create HoleNavigator component**

```tsx
// src/components/scoring/HoleNavigator.tsx
import { Flex, Button, Text } from '@radix-ui/themes'
import { useRef, useEffect } from 'react'

interface HoleNavigatorProps {
  currentHole: number
  onHoleChange: (hole: number) => void
  scores: (number | null)[]
  totalHoles?: number
}

export function HoleNavigator({
  currentHole,
  onHoleChange,
  scores,
  totalHoles = 18,
}: HoleNavigatorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll current hole into view
    const container = scrollRef.current
    if (!container) return

    const button = container.children[currentHole - 1] as HTMLElement
    if (button) {
      button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [currentHole])

  return (
    <Flex
      ref={scrollRef}
      gap="1"
      py="2"
      style={{
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {Array.from({ length: totalHoles }, (_, i) => {
        const hole = i + 1
        const isActive = hole === currentHole
        const hasScore = scores[i] !== null && scores[i] !== undefined

        return (
          <Button
            key={hole}
            variant={isActive ? 'solid' : 'soft'}
            color={isActive ? 'grass' : hasScore ? 'gray' : undefined}
            size="2"
            onClick={() => onHoleChange(hole)}
            style={{
              scrollSnapAlign: 'center',
              minWidth: '40px',
              flexShrink: 0,
            }}
          >
            <Text size="2" weight={isActive ? 'bold' : 'regular'}>
              {hole}
            </Text>
          </Button>
        )
      })}
    </Flex>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
jj new -m "feat: add HoleNavigator component with scroll-snap"
```

---

## Task 19: Add Shimmer to Skeleton

**Files:**
- Modify: `src/components/ui/Skeleton.tsx`

- [ ] **Step 1: Read current Skeleton implementation**

Run: `cat src/components/ui/Skeleton.tsx`

- [ ] **Step 2: Add shimmer class to skeletons**

Update each `<Skeleton>` component to include `className="skeleton-shimmer"`:

```tsx
<Skeleton width="60%" height="20px" className="skeleton-shimmer" />
```

The `.skeleton-shimmer` class already exists in styles.css.

- [ ] **Step 3: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
jj new -m "feat: add shimmer animation to skeleton components"
```

---

## Task 20: Remove Inline Styles from GolferCard and CourseCard

**Files:**
- Modify: `src/components/golfers/GolferCard.tsx`
- Modify: `src/components/courses/CourseCard.tsx`

- [ ] **Step 1: Read GolferCard**

Run: `cat src/components/golfers/GolferCard.tsx`

- [ ] **Step 2: Replace inline icon styles in GolferCard**

Find any `style={{ color: 'var(--grass-9)' }}` on icons and replace with `className="icon-grass"`.

- [ ] **Step 3: Read CourseCard**

Run: `cat src/components/courses/CourseCard.tsx`

- [ ] **Step 4: Replace inline icon styles in CourseCard**

Find any `style={{ color: 'var(--grass-9)' }}` on icons and replace with `className="icon-grass"`.

- [ ] **Step 5: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
jj new -m "refactor: remove inline styles from GolferCard and CourseCard"
```

---

## Task 21: Final Verification

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run dev server and test**

Run: `pnpm dev`

Test checklist:
1. Navigate to /trips — see staggered animation on trip cards
2. Resize browser < 640px — leaderboards show card view
3. Hover over cards — see lift animation
4. Empty states show only action button

- [ ] **Step 3: Run linter**

Run: `pnpm check`
Expected: No errors (warnings OK)

- [ ] **Step 4: Final commit**

```bash
jj new -m "chore: complete frontend visual polish implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | CSS tokens and animations | styles.css |
| 2 | Toast context and hook | ToastContext.tsx, useToast.ts |
| 3 | Toast component | Toast.tsx |
| 4 | AnimatedList component | AnimatedList.tsx |
| 5 | LoadingButton component | LoadingButton.tsx |
| 6 | MobileCard component | MobileCard.tsx |
| 7 | PageTransition component | PageTransition.tsx |
| 8 | Simplify EmptyState | EmptyState.tsx + usages |
| 9 | Enhance StatCard | StatCard.tsx |
| 10 | Integrate Toast into root | __root.tsx |
| 11 | AnimatedList on trips | trips/index.tsx |
| 12 | AnimatedList on golfers/courses | golfers/index.tsx, courses/index.tsx |
| 13 | Remove inline styles from TripCard | TripCard.tsx |
| 14 | Remove inline styles from LeaderboardTable | LeaderboardTable.tsx |
| 15 | Add MobileCard view to LeaderboardTable | LeaderboardTable.tsx |
| 16 | ScoreInput component | ScoreInput.tsx |
| 17 | GolferSwitcher component | GolferSwitcher.tsx |
| 18 | HoleNavigator component | HoleNavigator.tsx |
| 19 | Add shimmer to Skeleton | Skeleton.tsx |
| 20 | Remove inline styles from GolferCard/CourseCard | GolferCard.tsx, CourseCard.tsx |
| 21 | Final verification | — |
