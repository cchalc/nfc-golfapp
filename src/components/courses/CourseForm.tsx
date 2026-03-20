import { Flex, TextField, Button } from '@radix-ui/themes'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { courseCollection, formErrorCollection, type Course } from '../../db/collections'
import { FormField } from '../ui/FormField'
import { courseFormSchema, validateForm } from '../../lib/validation'

interface CourseFormProps {
  courseId?: string
  initialData?: Partial<Course>
  onSuccess?: () => void
}

export function CourseForm({ courseId, initialData, onSuccess }: CourseFormProps) {
  const formId = `course-form-${courseId || 'new'}`

  const { data: errors } = useLiveQuery(
    (q) => q.from({ e: formErrorCollection }).where(({ e }) => eq(e.formId, formId)),
    [formId]
  )
  const errorMap = new Map(errors?.map((e) => [e.field, e.message]) ?? [])

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
    errors?.forEach((err) => formErrorCollection.delete(err.id))

    // Validate
    const result = validateForm(courseFormSchema, data)

    if (!result.success) {
      Object.entries(result.errors).forEach(([field, message]) => {
        formErrorCollection.insert({
          id: crypto.randomUUID(),
          formId,
          field,
          message,
        })
      })
      return
    }

    if (courseId) {
      // Update existing
      courseCollection.update(courseId, (draft) => {
        draft.name = result.data.name
        draft.location = result.data.location
        draft.totalPar = result.data.totalPar
        draft.courseRating = result.data.courseRating
        draft.slopeRating = result.data.slopeRating
      })
    } else {
      // Create new
      courseCollection.insert({
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
      })
    }

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <FormField label="Course Name" name="name" error={errorMap.get('name')} required>
          <TextField.Root
            name="name"
            placeholder="Pebble Beach Golf Links"
            defaultValue={initialData?.name || ''}
          />
        </FormField>

        <FormField label="Location" name="location" error={errorMap.get('location')}>
          <TextField.Root
            name="location"
            placeholder="Pebble Beach, CA"
            defaultValue={initialData?.location || ''}
          />
        </FormField>

        <Flex gap="3">
          <FormField label="Total Par" name="totalPar" error={errorMap.get('totalPar')}>
            <TextField.Root
              name="totalPar"
              type="number"
              placeholder="72"
              defaultValue={initialData?.totalPar?.toString() || '72'}
            />
          </FormField>

          <FormField label="Course Rating" name="courseRating" error={errorMap.get('courseRating')}>
            <TextField.Root
              name="courseRating"
              type="number"
              step="0.1"
              placeholder="72.5"
              defaultValue={initialData?.courseRating?.toString() || ''}
            />
          </FormField>

          <FormField label="Slope Rating" name="slopeRating" error={errorMap.get('slopeRating')}>
            <TextField.Root
              name="slopeRating"
              type="number"
              placeholder="130"
              defaultValue={initialData?.slopeRating?.toString() || ''}
            />
          </FormField>
        </Flex>

        <Button type="submit">{courseId ? 'Save Changes' : 'Add Course'}</Button>
      </Flex>
    </form>
  )
}
