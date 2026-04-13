# Performance Optimization Testing Guide

## Quick Test Checklist

### ✅ Phase 3: Trip-Scoped Collections (99% Data Reduction)

**Network Tab:**
1. Open Network tab in DevTools
2. Clear (trash icon)
3. Navigate to a trip's leaderboards page
4. Look for requests to `/api/electric/*`
5. **Expected**: Far fewer rows synced (50-200 instead of 15K+)
6. **Expected**: Faster initial load (~200-500ms vs 3-5s)

**Console:**
```javascript
// Open Console and run this to check collection sizes:
console.log('Collections test - checking data reduction')
```

**Visual Tests:**
- Leaderboards load instantly
- Switching tabs (Stableford → Net → Birdies → KPs) is instantaneous
- No lag when scrolling through leaderboards

### ✅ Phase 1: Memoization (No Wasted Re-renders)

**React DevTools Profiler:**
1. Install React DevTools extension if not installed
2. Open React DevTools → Profiler tab
3. Click "Record" (circle icon)
4. Toggle a golfer's scoring inclusion on/off
5. Stop recording
6. **Expected**: Only affected components re-render
7. **Expected**: Render time < 16ms (60fps)

**Specific Tests:**
- **Leaderboards**: Toggle golfer scoring → only that row updates
- **Scorecard**: Enter a score → only that hole updates
- **No full page re-renders** when updating single items

### ✅ Phase 2: Eager Preloading (Instant Navigation)

**Test Navigation Speed:**
1. From trip detail page → Leaderboards
2. Leaderboards → Rounds → Scorecard
3. Back to Leaderboards
4. **Expected**: All transitions < 200ms
5. **Expected**: No loading spinners (data already cached)

**Browser Performance Timeline:**
1. Performance tab → Record
2. Navigate between trip pages (5 clicks)
3. Stop recording
4. **Expected**: No long tasks > 50ms
5. **Expected**: Minimal network requests (data cached)

## Detailed Performance Metrics

### Before Optimization (Baseline)

| Metric | Before | Target |
|--------|--------|--------|
| Leaderboard render | 500-700ms | < 16ms |
| Scorecard update | 150-200ms | < 50ms |
| Initial page load | 3-5s | < 500ms |
| roundSummaries rows | 15,000+ | 50-200 |
| Network payload | ~20MB | ~200KB |

### After Optimization (Expected)

Run these tests to verify improvements:

#### 1. Leaderboard Performance

```javascript
// In browser console on leaderboards page
performance.mark('leaderboard-start')
// Toggle a golfer's scoring
performance.mark('leaderboard-end')
performance.measure('leaderboard-toggle', 'leaderboard-start', 'leaderboard-end')
console.table(performance.getEntriesByType('measure'))
// Expected: < 50ms
```

#### 2. Data Sync Verification

Open Network tab, filter by "electric", refresh leaderboards page:

**Check Response Sizes:**
- `round-summaries`: Should be ~50-200 rows (not 15K+)
- `golfers`: Should be ~8-20 (not 1000s)
- `rounds`: Should be ~5-10 (not all rounds)

#### 3. Memory Usage

1. Open Performance Monitor (Cmd+Shift+P → "Show Performance Monitor")
2. Navigate through trip pages
3. **Expected**: Stable memory (no leaks)
4. **Expected**: Low CPU usage during idle

## Common Issues

### Issue: "useTripData must be used within TripDataProvider"

**Cause:** A trip page is trying to use trip-scoped collections but isn't wrapped in TripDataProvider

**Fix:** Ensure the page is under `/trips/$tripId/` route (wrapped by trip layout)

### Issue: Network requests still show full dataset

**Cause:** Browser cache or Electric shape not using WHERE clause

**Fix:**
1. Hard refresh (Cmd+Shift+R)
2. Check Electric proxy routes have correct WHERE params
3. Clear IndexedDB (Application tab → IndexedDB → right-click → Delete)

### Issue: Slow initial load

**Cause:** Electric sync mode might be progressive instead of immediate

**Check:** Look for "syncMode: 'immediate'" in trip-collections.ts for critical collections

## Performance Monitoring Code

Add this to any component to measure performance:

```typescript
import { measureSync, PERFORMANCE_BUDGETS } from '../lib/performance'

// Measure a calculation
const result = measureSync('leaderboard-aggregation', () => {
  // Your expensive computation
  return computeLeaderboard()
})

// Check against budget
import { checkBudget, BUDGET_CONFIGS } from '../lib/performance-budgets'
const check = checkBudget('leaderboard-aggregation', BUDGET_CONFIGS.leaderboardAggregation)
console.log(check.message) // Will show if over budget
```

## Automated Performance Tests

### Future: Add to CI/CD

```typescript
// Example performance test (could be added to test suite)
test('leaderboard aggregation meets performance budget', () => {
  const { data } = computeLeaderboard(mockData)
  const metrics = getMetrics('leaderboard-aggregation')
  expect(metrics.avg).toBeLessThan(PERFORMANCE_BUDGETS.QUERY_AGGREGATION)
})
```

## Success Criteria

✅ All pages load in < 500ms
✅ Network payload reduced by 90%+
✅ No re-renders on unrelated state changes
✅ Leaderboard toggles update instantly (< 50ms)
✅ Page transitions feel instant
✅ No console errors
✅ Stable memory usage

## Regression Prevention

Monitor these metrics over time:
- Initial sync time (should stay < 500ms)
- Collection sizes (should stay trip-scoped)
- Component render times (should stay < 16ms)
- Network payload (should stay < 1MB per trip)

If any metric regresses, investigate:
1. Were global collections used instead of trip-scoped?
2. Did memoization dependencies change?
3. Was preloading bypassed?
