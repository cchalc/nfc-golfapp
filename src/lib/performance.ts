/**
 * Performance monitoring utilities for millisecond-latency optimization
 *
 * Usage:
 * ```typescript
 * // Mark start/end
 * markStart('leaderboard-render')
 * // ... work ...
 * const measure = markEnd('leaderboard-render') // Returns PerformanceMeasure
 *
 * // Measure sync
 * const result = measureSync('calculation', () => {
 *   // ... expensive work ...
 *   return result
 * })
 *
 * // Measure async
 * const data = await measureAsync('fetch-data', async () => {
 *   return await fetchData()
 * })
 *
 * // Get metrics
 * const metrics = getMetrics('leaderboard-render')
 * console.log(metrics) // { count, avg, min, max, p50, p95, p99 }
 * ```
 */

interface PerformanceMetrics {
  label: string
  count: number
  total: number
  avg: number
  min: number
  max: number
  p50: number
  p95: number
  p99: number
  violations: number // Number of times budget was exceeded
}

interface PerformanceBudget {
  label: string
  budget: number // milliseconds
  warnThreshold?: number // optional warning threshold (defaults to 80% of budget)
}

type MetricsCallback = (metrics: PerformanceMetrics) => void

const marks = new Map<string, number>()
const measurements = new Map<string, number[]>()
const subscribers = new Set<MetricsCallback>()

/**
 * Mark the start of a performance measurement
 */
export function markStart(label: string): void {
  marks.set(label, performance.now())
}

/**
 * Mark the end of a performance measurement and return the duration
 */
export function markEnd(label: string): number {
  const start = marks.get(label)
  if (!start) {
    console.warn(`No start mark found for: ${label}`)
    return 0
  }

  const duration = performance.now() - start
  marks.delete(label)

  // Store measurement
  if (!measurements.has(label)) {
    measurements.set(label, [])
  }
  measurements.get(label)!.push(duration)

  // Notify subscribers
  const metrics = getMetrics(label)
  if (metrics) {
    for (const callback of subscribers) {
      callback(metrics)
    }
  }

  return duration
}

/**
 * Measure synchronous function execution time
 */
export function measureSync<T>(label: string, fn: () => T): T {
  markStart(label)
  try {
    return fn()
  } finally {
    markEnd(label)
  }
}

/**
 * Measure asynchronous function execution time
 */
export async function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  markStart(label)
  try {
    return await fn()
  } finally {
    markEnd(label)
  }
}

/**
 * Get aggregated metrics for a specific label
 */
export function getMetrics(label: string): PerformanceMetrics | null {
  const data = measurements.get(label)
  if (!data || data.length === 0) return null

  const sorted = [...data].sort((a, b) => a - b)
  const count = sorted.length
  const total = sorted.reduce((sum, val) => sum + val, 0)

  return {
    label,
    count,
    total,
    avg: total / count,
    min: sorted[0],
    max: sorted[count - 1],
    p50: sorted[Math.floor(count * 0.5)],
    p95: sorted[Math.floor(count * 0.95)],
    p99: sorted[Math.floor(count * 0.99)],
    violations: 0, // Will be calculated when budget is checked
  }
}

/**
 * Get all metrics
 */
export function getAllMetrics(): PerformanceMetrics[] {
  const allMetrics: PerformanceMetrics[] = []
  for (const label of measurements.keys()) {
    const metrics = getMetrics(label)
    if (metrics) {
      allMetrics.push(metrics)
    }
  }
  return allMetrics
}

/**
 * Subscribe to metrics updates
 */
export function subscribeToMetrics(callback: MetricsCallback): () => void {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

/**
 * Clear all measurements (useful for testing)
 */
export function clearMetrics(): void {
  measurements.clear()
  marks.clear()
}

/**
 * Check if a metric exceeds its performance budget
 */
export function checkBudget(label: string, budget: PerformanceBudget): {
  ok: boolean
  metrics: PerformanceMetrics | null
  exceeded: number // milliseconds over budget
  message: string
} {
  const metrics = getMetrics(label)
  if (!metrics) {
    return {
      ok: true,
      metrics: null,
      exceeded: 0,
      message: `No measurements found for: ${label}`,
    }
  }

  const warnThreshold = budget.warnThreshold ?? budget.budget * 0.8
  const exceeded = Math.max(0, metrics.avg - budget.budget)
  const warnExceeded = Math.max(0, metrics.avg - warnThreshold)

  // Count violations
  const data = measurements.get(label) || []
  const violations = data.filter((d) => d > budget.budget).length
  metrics.violations = violations

  if (exceeded > 0) {
    return {
      ok: false,
      metrics,
      exceeded,
      message: `❌ ${label}: ${metrics.avg.toFixed(2)}ms (budget: ${budget.budget}ms, exceeded by ${exceeded.toFixed(2)}ms)`,
    }
  }

  if (warnExceeded > 0) {
    return {
      ok: true,
      metrics,
      exceeded: 0,
      message: `⚠️  ${label}: ${metrics.avg.toFixed(2)}ms (budget: ${budget.budget}ms, warning threshold: ${warnThreshold.toFixed(2)}ms)`,
    }
  }

  return {
    ok: true,
    metrics,
    exceeded: 0,
    message: `✅ ${label}: ${metrics.avg.toFixed(2)}ms (budget: ${budget.budget}ms)`,
  }
}

/**
 * Generate performance report for all metrics
 */
export function generateReport(budgets?: PerformanceBudget[]): string {
  const allMetrics = getAllMetrics()

  if (allMetrics.length === 0) {
    return 'No performance metrics collected'
  }

  const lines: string[] = []
  lines.push('Performance Report')
  lines.push('='.repeat(80))
  lines.push('')

  for (const metrics of allMetrics) {
    lines.push(`${metrics.label}:`)
    lines.push(`  Count: ${metrics.count}`)
    lines.push(`  Avg: ${metrics.avg.toFixed(2)}ms`)
    lines.push(`  Min: ${metrics.min.toFixed(2)}ms`)
    lines.push(`  Max: ${metrics.max.toFixed(2)}ms`)
    lines.push(`  P50: ${metrics.p50.toFixed(2)}ms`)
    lines.push(`  P95: ${metrics.p95.toFixed(2)}ms`)
    lines.push(`  P99: ${metrics.p99.toFixed(2)}ms`)

    // Check budget if provided
    const budget = budgets?.find((b) => b.label === metrics.label)
    if (budget) {
      const check = checkBudget(metrics.label, budget)
      lines.push(`  ${check.message}`)
      if (check.metrics) {
        lines.push(`  Violations: ${check.metrics.violations}/${check.metrics.count}`)
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}
