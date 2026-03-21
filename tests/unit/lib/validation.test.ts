import { describe, it, expect } from 'vitest'
import {
  golferFormSchema,
  tripFormSchema,
  challengeFormSchema,
  courseFormSchema,
  validateForm,
} from '../../../src/lib/validation'
import { createGolfer, createTrip, createCourse } from '../../fixtures/factories'

describe('golferFormSchema', () => {
  it('accepts valid golfer data', () => {
    const golfer = createGolfer()
    const result = golferFormSchema.safeParse(golfer)
    expect(result.success).toBe(true)
  })

  describe('name validation', () => {
    it('rejects name shorter than 2 characters', () => {
      const golfer = createGolfer({ name: 'A' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(false)
    })

    it('accepts name with exactly 2 characters', () => {
      const golfer = createGolfer({ name: 'Jo' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const golfer = createGolfer({ name: '' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(false)
    })
  })

  describe('email validation', () => {
    it('accepts valid email', () => {
      const golfer = createGolfer({ email: 'test@example.com' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(true)
    })

    it('accepts empty email (optional)', () => {
      const golfer = createGolfer({ email: '' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const golfer = createGolfer({ email: 'not-an-email' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(false)
    })

    it('rejects email without domain', () => {
      const golfer = createGolfer({ email: 'test@' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(false)
    })
  })

  describe('handicap validation', () => {
    it('accepts handicap of 0', () => {
      const golfer = createGolfer({ handicap: 0 })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(true)
    })

    it('accepts handicap of 54 (max)', () => {
      const golfer = createGolfer({ handicap: 54 })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(true)
    })

    it('rejects negative handicap', () => {
      const golfer = createGolfer({ handicap: -1 })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(false)
    })

    it('rejects handicap over 54', () => {
      const golfer = createGolfer({ handicap: 55 })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(false)
    })

    it('accepts decimal handicaps', () => {
      const golfer = createGolfer({ handicap: 15.5 })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(true)
    })
  })

  describe('phone validation', () => {
    it('accepts any string for phone', () => {
      const golfer = createGolfer({ phone: '555-1234' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(true)
    })

    it('accepts empty phone', () => {
      const golfer = createGolfer({ phone: '' })
      const result = golferFormSchema.safeParse(golfer)
      expect(result.success).toBe(true)
    })
  })
})

describe('tripFormSchema', () => {
  it('accepts valid trip data', () => {
    const trip = createTrip()
    const result = tripFormSchema.safeParse(trip)
    expect(result.success).toBe(true)
  })

  describe('name validation', () => {
    it('rejects name shorter than 2 characters', () => {
      const trip = createTrip({ name: 'A' })
      const result = tripFormSchema.safeParse(trip)
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const trip = createTrip({ name: '' })
      const result = tripFormSchema.safeParse(trip)
      expect(result.success).toBe(false)
    })
  })

  describe('date validation', () => {
    it('accepts same start and end date', () => {
      const trip = createTrip({ startDate: '2024-06-01', endDate: '2024-06-01' })
      const result = tripFormSchema.safeParse(trip)
      expect(result.success).toBe(true)
    })

    it('rejects end date before start date', () => {
      const trip = createTrip({ startDate: '2024-06-07', endDate: '2024-06-01' })
      const result = tripFormSchema.safeParse(trip)
      expect(result.success).toBe(false)
      if (!result.success) {
        const endDateError = result.error.issues.find((i) => i.path.includes('endDate'))
        expect(endDateError?.message).toBe('End date must be after start date')
      }
    })

    it('rejects empty start date', () => {
      const trip = createTrip({ startDate: '' })
      const result = tripFormSchema.safeParse(trip)
      expect(result.success).toBe(false)
    })

    it('rejects empty end date', () => {
      const trip = createTrip({ endDate: '' })
      const result = tripFormSchema.safeParse(trip)
      expect(result.success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts empty description', () => {
      const trip = createTrip({ description: '' })
      const result = tripFormSchema.safeParse(trip)
      expect(result.success).toBe(true)
    })

    it('accepts empty location', () => {
      const trip = createTrip({ location: '' })
      const result = tripFormSchema.safeParse(trip)
      expect(result.success).toBe(true)
    })
  })
})

describe('challengeFormSchema', () => {
  const validChallenge = {
    name: 'Closest to Pin',
    challengeType: 'closest_to_pin' as const,
    scope: 'hole' as const,
    roundId: 'round-123',
    holeId: 'hole-456',
    prizeDescription: '$50',
  }

  it('accepts valid challenge data', () => {
    const result = challengeFormSchema.safeParse(validChallenge)
    expect(result.success).toBe(true)
  })

  describe('scope and roundId validation', () => {
    it('accepts trip scope without roundId', () => {
      const challenge = { ...validChallenge, scope: 'trip' as const, roundId: null, holeId: null }
      const result = challengeFormSchema.safeParse(challenge)
      expect(result.success).toBe(true)
    })

    it('requires roundId for round scope', () => {
      const challenge = { ...validChallenge, scope: 'round' as const, roundId: null, holeId: null }
      const result = challengeFormSchema.safeParse(challenge)
      expect(result.success).toBe(false)
      if (!result.success) {
        const roundError = result.error.issues.find((i) => i.path.includes('roundId'))
        expect(roundError?.message).toBe('Round is required')
      }
    })

    it('requires roundId for hole scope', () => {
      const challenge = { ...validChallenge, scope: 'hole' as const, roundId: null }
      const result = challengeFormSchema.safeParse(challenge)
      expect(result.success).toBe(false)
    })
  })

  describe('scope and holeId validation', () => {
    it('accepts round scope without holeId', () => {
      const challenge = { ...validChallenge, scope: 'round' as const, holeId: null }
      const result = challengeFormSchema.safeParse(challenge)
      expect(result.success).toBe(true)
    })

    it('requires holeId for hole scope', () => {
      const challenge = { ...validChallenge, scope: 'hole' as const, holeId: null }
      const result = challengeFormSchema.safeParse(challenge)
      expect(result.success).toBe(false)
      if (!result.success) {
        const holeError = result.error.issues.find((i) => i.path.includes('holeId'))
        expect(holeError?.message).toBe('Hole is required')
      }
    })
  })

  describe('name validation', () => {
    it('accepts empty name (optional)', () => {
      const challenge = { ...validChallenge, name: '' }
      const result = challengeFormSchema.safeParse(challenge)
      expect(result.success).toBe(true)
    })

    it('accepts undefined name', () => {
      const challenge = { ...validChallenge, name: undefined }
      const result = challengeFormSchema.safeParse(challenge)
      expect(result.success).toBe(true)
    })
  })

  describe('challengeType validation', () => {
    it('accepts all valid challenge types', () => {
      const types = ['closest_to_pin', 'longest_drive', 'most_birdies', 'custom'] as const
      for (const type of types) {
        const challenge = { ...validChallenge, challengeType: type }
        const result = challengeFormSchema.safeParse(challenge)
        expect(result.success).toBe(true)
      }
    })

    it('rejects invalid challenge type', () => {
      const challenge = { ...validChallenge, challengeType: 'invalid' }
      const result = challengeFormSchema.safeParse(challenge)
      expect(result.success).toBe(false)
    })
  })
})

describe('courseFormSchema', () => {
  it('accepts valid course data', () => {
    const course = createCourse()
    const result = courseFormSchema.safeParse(course)
    expect(result.success).toBe(true)
  })

  describe('name validation', () => {
    it('rejects name shorter than 2 characters', () => {
      const course = createCourse({ name: 'A' })
      const result = courseFormSchema.safeParse(course)
      expect(result.success).toBe(false)
    })
  })

  describe('totalPar validation', () => {
    it('accepts valid par', () => {
      const course = createCourse({ totalPar: 72 })
      const result = courseFormSchema.safeParse(course)
      expect(result.success).toBe(true)
    })

    it('rejects par of 0', () => {
      const course = createCourse({ totalPar: 0 })
      const result = courseFormSchema.safeParse(course)
      expect(result.success).toBe(false)
    })

    it('rejects negative par', () => {
      const course = createCourse({ totalPar: -1 })
      const result = courseFormSchema.safeParse(course)
      expect(result.success).toBe(false)
    })
  })

  describe('nullable fields', () => {
    it('accepts null course rating', () => {
      const course = createCourse({ courseRating: null })
      const result = courseFormSchema.safeParse(course)
      expect(result.success).toBe(true)
    })

    it('accepts null slope rating', () => {
      const course = createCourse({ slopeRating: null })
      const result = courseFormSchema.safeParse(course)
      expect(result.success).toBe(true)
    })
  })
})

describe('validateForm', () => {
  describe('with valid data', () => {
    it('returns success and parsed data', () => {
      const golfer = createGolfer()
      const result = validateForm(golferFormSchema, golfer)
      expect(result.success).toBe(true)
      if (result.success) {
        // Only compare fields that the form schema validates
        expect(result.data).toEqual({
          name: golfer.name,
          email: golfer.email,
          phone: golfer.phone,
          handicap: golfer.handicap,
        })
      }
    })
  })

  describe('with invalid data', () => {
    it('returns errors object with field keys', () => {
      const invalidGolfer = { ...createGolfer(), name: 'A', handicap: 100 }
      const result = validateForm(golferFormSchema, invalidGolfer)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.name).toBeDefined()
        expect(result.errors.handicap).toBeDefined()
      }
    })

    it('includes error messages', () => {
      const invalidGolfer = { ...createGolfer(), name: 'A' }
      const result = validateForm(golferFormSchema, invalidGolfer)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.name).toBe('Name must be at least 2 characters')
      }
    })
  })

  describe('with refine errors', () => {
    it('captures refinement errors with correct path', () => {
      const invalidTrip = createTrip({ startDate: '2024-06-07', endDate: '2024-06-01' })
      const result = validateForm(tripFormSchema, invalidTrip)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.endDate).toBe('End date must be after start date')
      }
    })
  })
})
