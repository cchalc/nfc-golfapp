/**
 * Test golfer fixtures for Bombadil specs
 */

export interface TestGolfer {
  name: string
  email: string
  phone: string
  handicap: number
}

// Representative golfers spanning handicap range
export const TEST_GOLFERS: TestGolfer[] = [
  { name: 'Scratch Player', email: 'scratch@test.com', phone: '', handicap: 0 },
  { name: 'Single Digit', email: 'single@test.com', phone: '', handicap: 8 },
  { name: 'Mid Handicapper', email: 'mid@test.com', phone: '', handicap: 18 },
  { name: 'High Handicapper', email: 'high@test.com', phone: '', handicap: 28 },
  { name: 'Max Handicapper', email: 'max@test.com', phone: '', handicap: 54 },
]

// Edge case handicaps for property testing
export const EDGE_HANDICAPS = [0, 1, 17, 18, 19, 35, 36, 37, 54]

// Random handicap generator within valid range
export function randomHandicap(): number {
  return Math.floor(Math.random() * 55)
}

// Generate random golfer name
export function randomGolferName(): string {
  const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana']
  const lastNames = ['Smith', 'Jones', 'Woods', 'Palmer', 'Nicklaus', 'Hogan']
  const first = firstNames[Math.floor(Math.random() * firstNames.length)]
  const last = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${first} ${last}`
}
