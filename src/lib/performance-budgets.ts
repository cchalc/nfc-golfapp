/**
 * Performance budgets for millisecond-latency optimization
 *
 * Budgets are based on:
 * - Query execution: < 10ms
 * - Component render: < 16ms (60fps)
 * - Initial sync: < 100ms
 * - Live updates: < 50ms
 * - Page transitions: < 200ms
 */

export const PERFORMANCE_BUDGETS = {
  // Query execution budgets
  QUERY_EXECUTION: 10, // milliseconds
  QUERY_AGGREGATION: 10,
  QUERY_FILTER: 5,

  // Component render budgets
  COMPONENT_RENDER: 16, // 60fps = 16.67ms per frame
  LEADERBOARD_RENDER: 16,
  SCORECARD_RENDER: 16,
  SCORECARD_UPDATE: 16,

  // Data loading budgets
  INITIAL_SYNC: 100,
  SHAPE_SYNC: 100,
  COLLECTION_LOAD: 50,

  // User interaction budgets
  LIVE_UPDATE: 50,
  SCORE_ENTRY: 50,
  TOGGLE_SCORING: 50,

  // Page navigation budgets
  PAGE_TRANSITION: 200,
  ROUTE_LOAD: 200,
} as const

export type PerformanceBudgetKey = keyof typeof PERFORMANCE_BUDGETS

/**
 * Get performance budget by key
 */
export function getBudget(key: PerformanceBudgetKey): number {
  return PERFORMANCE_BUDGETS[key]
}

/**
 * Create a budget configuration for checking
 */
export function createBudget(
  label: string,
  budget: number,
  warnThreshold?: number
): { label: string; budget: number; warnThreshold?: number } {
  return { label, budget, warnThreshold }
}

/**
 * Predefined budget configurations for common measurements
 */
export const BUDGET_CONFIGS = {
  leaderboardRender: createBudget('leaderboard-render', PERFORMANCE_BUDGETS.LEADERBOARD_RENDER),
  leaderboardAggregation: createBudget(
    'leaderboard-aggregation',
    PERFORMANCE_BUDGETS.QUERY_AGGREGATION
  ),
  scorecardRender: createBudget('scorecard-render', PERFORMANCE_BUDGETS.SCORECARD_RENDER),
  scorecardUpdate: createBudget('scorecard-update', PERFORMANCE_BUDGETS.SCORECARD_UPDATE),
  queryExecution: createBudget('query-execution', PERFORMANCE_BUDGETS.QUERY_EXECUTION),
  shapeSync: createBudget('shape-sync', PERFORMANCE_BUDGETS.SHAPE_SYNC),
  pageTransition: createBudget('page-transition', PERFORMANCE_BUDGETS.PAGE_TRANSITION),
} as const
