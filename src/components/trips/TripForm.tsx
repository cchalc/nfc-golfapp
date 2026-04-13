import { useState } from 'react'
import { Flex, TextField, TextArea, Button } from '@radix-ui/themes'
import { useCreateTrip, useUpdateTrip } from '../../hooks/queries'
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
  const [errors, setErrors] = useState<Map<string, string>>(new Map())

  const createTrip = useCreateTrip()
  const updateTrip = useUpdateTrip()

  const isPending = createTrip.isPending || updateTrip.isPending

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
    setErrors(new Map())

    // Validate
    const result = validateForm(tripFormSchema, data)

    if (!result.success) {
      setErrors(new Map(Object.entries(result.errors)))
      return
    }

    if (isEditing && tripId) {
      updateTrip.mutate(
        {
          id: tripId,
          changes: {
            name: result.data.name,
            description: result.data.description,
            startDate: new Date(result.data.startDate),
            endDate: new Date(result.data.endDate),
            location: result.data.location,
          },
        },
        {
          onSuccess: () => onSuccess?.(),
        }
      )
    } else {
      createTrip.mutate(
        {
          id: crypto.randomUUID(),
          name: result.data.name,
          description: result.data.description,
          startDate: new Date(result.data.startDate),
          endDate: new Date(result.data.endDate),
          location: result.data.location,
          createdBy: 'user',
        },
        {
          onSuccess: () => onSuccess?.(),
        }
      )
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <FormField label="Trip Name" name="name" error={errors.get('name')} required>
          <TextField.Root
            id="name"
            name="name"
            placeholder="Kelowna Golf Trip 2025"
            defaultValue={initialData?.name}
          />
        </FormField>

        <FormField label="Description" name="description" error={errors.get('description')}>
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
            error={errors.get('startDate')}
            required
          >
            <TextField.Root
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={initialData?.startDate}
            />
          </FormField>

          <FormField label="End Date" name="endDate" error={errors.get('endDate')} required>
            <TextField.Root
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={initialData?.endDate}
            />
          </FormField>
        </Flex>

        <FormField label="Location" name="location" error={errors.get('location')}>
          <TextField.Root
            id="location"
            name="location"
            placeholder="Kelowna, BC"
            defaultValue={initialData?.location}
          />
        </FormField>

        <Button type="submit" color="grass" size="3" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Trip'}
        </Button>
      </Flex>
    </form>
  )
}
