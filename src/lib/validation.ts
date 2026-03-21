import { z } from 'zod'

// Golfer form schema
export const golferFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').or(z.literal('')),
  phone: z.string(),
  handicap: z.number().min(0, 'Min 0').max(54, 'Max 54'),
})

// Trip form schema
export const tripFormSchema = z
  .object({
    name: z.string().min(2, 'Name required'),
    description: z.string(),
    startDate: z.string().min(1, 'Start date required'),
    endDate: z.string().min(1, 'End date required'),
    location: z.string(),
  })
  .refine(
    (data) => !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
    { message: 'End date must be after start date', path: ['endDate'] }
  )

// Challenge form schema
export const challengeFormSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    challengeType: z.enum([
      'closest_to_pin',
      'longest_drive',
      'most_birdies',
      'custom',
    ]),
    scope: z.enum(['hole', 'round', 'trip']),
    roundId: z.string().nullable(),
    holeId: z.string().nullable(),
    prizeDescription: z.string(),
  })
  .refine((data) => data.scope === 'trip' || data.roundId !== null, {
    message: 'Round is required',
    path: ['roundId'],
  })
  .refine((data) => data.scope !== 'hole' || data.holeId !== null, {
    message: 'Hole is required',
    path: ['holeId'],
  })

// Course form schema
export const courseFormSchema = z.object({
  name: z.string().min(2, 'Name required'),
  location: z.string(),
  courseRating: z.number().nullable(),
  slopeRating: z.number().nullable(),
  totalPar: z.number().min(1, 'Par required'),
})

// Helper to validate form data
export function validateForm<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors: Record<string, string> = {}
  // Zod v4 uses `issues` instead of `errors`
  for (const issue of result.error.issues) {
    if (issue.path.length > 0) {
      errors[issue.path[0].toString()] = issue.message
    }
  }
  return { success: false, errors }
}
