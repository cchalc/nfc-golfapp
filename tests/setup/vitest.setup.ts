// Global test setup for Vitest
import { expect, vi } from 'vitest'

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    }
  },
})

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeWithinRange(floor: number, ceiling: number): T
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): unknown
  }
}
