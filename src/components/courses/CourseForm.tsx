import { Flex, Text, TextField, Button } from '@radix-ui/themes'
import { courseCollection, type Course } from '../../db/collections'

interface CourseFormProps {
  courseId?: string
  initialData?: Partial<Course>
  onSuccess?: () => void
}

export function CourseForm({ courseId, initialData, onSuccess }: CourseFormProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const name = formData.get('name') as string
    const location = formData.get('location') as string
    const totalPar = parseInt(formData.get('totalPar') as string) || 72
    const courseRating = parseFloat(formData.get('courseRating') as string) || null
    const slopeRating = parseInt(formData.get('slopeRating') as string) || null

    if (courseId) {
      // Update existing
      courseCollection.update(courseId, (draft) => {
        draft.name = name
        draft.location = location
        draft.totalPar = totalPar
        draft.courseRating = courseRating
        draft.slopeRating = slopeRating
      })
    } else {
      // Create new
      courseCollection.insert({
        id: crypto.randomUUID(),
        apiId: null,
        name,
        clubName: name,
        location,
        address: '',
        city: '',
        state: '',
        country: '',
        latitude: null,
        longitude: null,
        totalPar,
        courseRating,
        slopeRating,
      })
    }

    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Course Name *
          </Text>
          <TextField.Root
            name="name"
            placeholder="Pebble Beach Golf Links"
            defaultValue={initialData?.name || ''}
            required
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium">
            Location
          </Text>
          <TextField.Root
            name="location"
            placeholder="Pebble Beach, CA"
            defaultValue={initialData?.location || ''}
          />
        </Flex>

        <Flex gap="3">
          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text as="label" size="2" weight="medium">
              Total Par
            </Text>
            <TextField.Root
              name="totalPar"
              type="number"
              placeholder="72"
              defaultValue={initialData?.totalPar?.toString() || '72'}
            />
          </Flex>

          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text as="label" size="2" weight="medium">
              Course Rating
            </Text>
            <TextField.Root
              name="courseRating"
              type="number"
              step="0.1"
              placeholder="72.5"
              defaultValue={initialData?.courseRating?.toString() || ''}
            />
          </Flex>

          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Text as="label" size="2" weight="medium">
              Slope Rating
            </Text>
            <TextField.Root
              name="slopeRating"
              type="number"
              placeholder="130"
              defaultValue={initialData?.slopeRating?.toString() || ''}
            />
          </Flex>
        </Flex>

        <Button type="submit">{courseId ? 'Save Changes' : 'Add Course'}</Button>
      </Flex>
    </form>
  )
}
