import { Flex, TextField, TextArea, Button } from '@radix-ui/themes'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { tripCollection, formErrorCollection } from '../../db/collections'
import { FormField } from '../ui/FormField'
import { tripFormSchema, validateForm } from '../../lib/validation'

interface TripFormData {
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
}

interface TripFormProps {
  initialData?: Partial<TripFormData>
  tripId?: string
  onSuccess?: () => void
}

export function TripForm({ initialData, tripId, onSuccess }: TripFormProps) {
  const isEditing = !!tripId
  const formId = `trip-form-${tripId || 'new'}`

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
      description: (formData.get('description') as string).trim(),
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      location: (formData.get('location') as string).trim(),
    }

    // Clear old errors
    errors?.forEach((err) => formErrorCollection.delete(err.id))

    // Validate
    const result = validateForm(tripFormSchema, data)

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

    if (isEditing && tripId) {
      tripCollection.update(tripId, (draft) => {
        draft.name = result.data.name
        draft.description = result.data.description
        draft.startDate = new Date(result.data.startDate)
        draft.endDate = new Date(result.data.endDate)
        draft.location = result.data.location
      })
    } else {
      tripCollection.insert({
        id: crypto.randomUUID(),
        name: result.data.name,
        description: result.data.description,
        startDate: new Date(result.data.startDate),
        endDate: new Date(result.data.endDate),
        location: result.data.location,
        createdBy: 'user',
        createdAt: new Date(),
      })
    }

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <FormField label="Trip Name" name="name" error={errorMap.get('name')} required>
          <TextField.Root
            id="name"
            name="name"
            placeholder="Kelowna Golf Trip 2025"
            defaultValue={initialData?.name}
          />
        </FormField>

        <FormField label="Description" name="description" error={errorMap.get('description')}>
          <TextArea
            id="description"
            name="description"
            placeholder="Annual golf trip with the crew"
            defaultValue={initialData?.description}
          />
        </FormField>

        <Flex gap="4">
          <FormField
            label="Start Date"
            name="startDate"
            error={errorMap.get('startDate')}
            required
          >
            <TextField.Root
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={initialData?.startDate}
            />
          </FormField>

          <FormField label="End Date" name="endDate" error={errorMap.get('endDate')} required>
            <TextField.Root
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={initialData?.endDate}
            />
          </FormField>
        </Flex>

        <FormField label="Location" name="location" error={errorMap.get('location')}>
          <TextField.Root
            id="location"
            name="location"
            placeholder="Kelowna, BC"
            defaultValue={initialData?.location}
          />
        </FormField>

        <Button type="submit" color="grass" size="3">
          {isEditing ? 'Save Changes' : 'Create Trip'}
        </Button>
      </Flex>
    </form>
  )
}
