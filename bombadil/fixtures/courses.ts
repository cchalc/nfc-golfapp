/**
 * Test course fixtures for Bombadil specs
 */

export interface TestHole {
  holeNumber: number
  par: number
  strokeIndex: number
  yardage: number
}

export interface TestCourse {
  name: string
  location: string
  courseRating: number | null
  slopeRating: number | null
  totalPar: number
  holes: TestHole[]
}

// Standard 18-hole course (regulation par 72)
export const STANDARD_COURSE: TestCourse = {
  name: 'Test Course',
  location: 'Test City, ST',
  courseRating: 72.0,
  slopeRating: 125,
  totalPar: 72,
  holes: [
    { holeNumber: 1, par: 4, strokeIndex: 7, yardage: 380 },
    { holeNumber: 2, par: 5, strokeIndex: 15, yardage: 520 },
    { holeNumber: 3, par: 3, strokeIndex: 11, yardage: 165 },
    { holeNumber: 4, par: 4, strokeIndex: 1, yardage: 425 },
    { holeNumber: 5, par: 4, strokeIndex: 9, yardage: 390 },
    { holeNumber: 6, par: 3, strokeIndex: 17, yardage: 145 },
    { holeNumber: 7, par: 4, strokeIndex: 5, yardage: 410 },
    { holeNumber: 8, par: 5, strokeIndex: 13, yardage: 545 },
    { holeNumber: 9, par: 4, strokeIndex: 3, yardage: 405 },
    { holeNumber: 10, par: 4, strokeIndex: 8, yardage: 385 },
    { holeNumber: 11, par: 4, strokeIndex: 2, yardage: 430 },
    { holeNumber: 12, par: 3, strokeIndex: 16, yardage: 155 },
    { holeNumber: 13, par: 5, strokeIndex: 12, yardage: 535 },
    { holeNumber: 14, par: 4, strokeIndex: 6, yardage: 400 },
    { holeNumber: 15, par: 4, strokeIndex: 4, yardage: 415 },
    { holeNumber: 16, par: 3, strokeIndex: 18, yardage: 140 },
    { holeNumber: 17, par: 4, strokeIndex: 10, yardage: 395 },
    { holeNumber: 18, par: 5, strokeIndex: 14, yardage: 550 },
  ],
}

// Generate random valid gross score for a hole
export function randomGrossScore(par: number): number {
  // Scores typically range from par-2 (eagle) to par+4 (quad bogey)
  const min = Math.max(1, par - 2)
  const max = Math.min(15, par + 4)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generate array of random scores for all holes
export function randomRoundScores(holes: TestHole[]): number[] {
  return holes.map((hole) => randomGrossScore(hole.par))
}
