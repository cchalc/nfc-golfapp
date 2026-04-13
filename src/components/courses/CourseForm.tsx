import { useState } from 'react'
import { Flex, TextField, Button } from '@radix-ui/themes'
import { useCreateCourse, useUpdateCourse } from '../../hooks/queries'
import { FormField } from '../ui/FormField'
import { courseFormSchema, validateForm } from '../../lib/validation'
import type { Course } from '../../db/collections'

interface CourseFormProps {
  courseId?: string
  initialData?: Partial<Course>
  onSuccess?: () => void
}

export function CourseForm({ courseId, initialData, onSuccess }: CourseFormProps) {
  const [errors, setErrors] = useState<Map<string, string>>(new Map())

  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()

  const isPending = createCourse.isPending || updateCourse.isPending

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      name: (formData.get('name') as string).trim(),
      location: (formData.get('location') as string).trim(),
      totalPar: parseInt(formData.get('totalPar') as string) || 72,
      courseRating: parseFloat(formData.get('courseRating') as string) || null,
      slopeRating: parseInt(formData.get('slopeRating') as string) || null,
    }

    // Clear old errors
    setErrors(new Map())

    // Validate
    const result = validateForm(courseFormSchema, data)

    if (!result.success) {
      setErrors(new Map(Object.entries(result.errors)))
      return
    }

    if (courseId) {
      // Update existing
      updateCourse.mutate(
        {
          id: courseId,
          changes: {
            name: result.data.name,
            location: result.data.location,
            totalPar: result.data.totalPar,
            courseRating: result.data.courseRating,
            slopeRating: result.data.slopeRating,
          },
        },
        {
          onSuccess: () => onSuccess?.(),
        }
      )
    } else {
      // Create new
      const newCourse: Course = {
        id: crypto.randomUUID(),
        apiId: null,
        name: result.data.name,
        clubName: result.data.name,
        location: result.data.location,
        address: '',
        city: '',
        state: '',
        country: '',
        latitude: null,
        longitude: null,
        totalPar: result.data.totalPar,
        courseRating: result.data.courseRating,
        slopeRating: result.data.slopeRating,
      }

      createCourse.mutate(newCourse, {
        onSuccess: () => onSuccess?.(),
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <FormField label="Course Name" name="name" error={errors.get('name')} required>
          <TextField.Root
            name="name"
            placeholder="Pebble Beach Golf Links"
            defaultValue={initialData?.name || ''}
          />
        </FormField>

        <FormField label="Location" name="location" error={errors.get('location')}>
          <TextField.Root
            name="location"
            placeholder="Pebble Beach, CA"
            defaultValue={initialData?.location || ''}
          />
        </FormField>

        <Flex gap="3">
          <FormField label="Total Par" name="totalPar" error={errors.get('totalPar')}>
            <TextField.Root
              name="totalPar"
              type="number"
              placeholder="72"
              defaultValue={initialData?.totalPar?.toString() || '72'}
            />
          </FormField>

          <FormField label="Course Rating" name="courseRating" error={errors.get('courseRating')}>
            <TextField.Root
              name="courseRating"
              type="number"
              step="0.1"
              placeholder="72.5"
              defaultValue={initialData?.courseRating?.toString() || ''}
            />
          </FormField>

          <FormField label="Slope Rating" name="slopeRating" error={errors.get('slopeRating')}>
            <TextField.Root
              name="slopeRating"
              type="number"
              placeholder="130"
              defaultValue={initialData?.slopeRating?.toString() || ''}
            />
          </FormField>
        </Flex>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : courseId ? 'Save Changes' : 'Add Course'}
        </Button>
      </Flex>
    </form>
  )
}
