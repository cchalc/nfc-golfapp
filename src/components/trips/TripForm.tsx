import { Flex, TextField, TextArea, Button, Text } from '@radix-ui/themes'
import { tripCollection } from '../../db/collections'

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
      location: formData.get('location') as string,
    }

    if (isEditing && tripId) {
      tripCollection.update(tripId, (draft) => {
        draft.name = data.name
        draft.description = data.description
        draft.startDate = data.startDate
        draft.endDate = data.endDate
        draft.location = data.location
      })
    } else {
      tripCollection.insert({
        id: crypto.randomUUID(),
        ...data,
        createdBy: 'user',
        createdAt: new Date(),
      })
    }

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="name">
            Trip Name
          </Text>
          <TextField.Root
            id="name"
            name="name"
            placeholder="Kelowna Golf Trip 2025"
            defaultValue={initialData?.name}
            required
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="description">
            Description
          </Text>
          <TextArea
            id="description"
            name="description"
            placeholder="Annual golf trip with the crew"
            defaultValue={initialData?.description}
          />
        </Flex>

        <Flex gap="4">
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text as="label" size="2" weight="medium" htmlFor="startDate">
              Start Date
            </Text>
            <TextField.Root
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={initialData?.startDate}
              required
            />
          </Flex>

          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text as="label" size="2" weight="medium" htmlFor="endDate">
              End Date
            </Text>
            <TextField.Root
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={initialData?.endDate}
              required
            />
          </Flex>
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="location">
            Location
          </Text>
          <TextField.Root
            id="location"
            name="location"
            placeholder="Kelowna, BC"
            defaultValue={initialData?.location}
          />
        </Flex>

        <Button type="submit" color="grass" size="3">
          {isEditing ? 'Save Changes' : 'Create Trip'}
        </Button>
      </Flex>
    </form>
  )
}
