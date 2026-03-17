import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Container,
  Flex,
  Heading,
  Text,
  TextField,
  TextArea,
  Button,
  Select,
} from '@radix-ui/themes'
import { useLiveQuery, eq } from '@tanstack/react-db'
import {
  tripCollection,
  courseCollection,
  roundCollection,
} from '../../../../db/collections'

export const Route = createFileRoute('/trips/$tripId/rounds/new')({
  ssr: false,
  component: NewRoundPage,
})

function NewRoundPage() {
  const { tripId } = Route.useParams()
  const navigate = useNavigate()

  const { data: trips } = useLiveQuery(
    (q) => q.from({ trip: tripCollection }).where(({ trip }) => eq(trip.id, tripId)),
    [tripId]
  )
  const trip = trips?.[0]

  const { data: courses } = useLiveQuery(
    (q) =>
      q.from({ course: courseCollection }).orderBy(({ course }) => course.name, 'asc'),
    []
  )

  const { data: existingRounds } = useLiveQuery(
    (q) =>
      q
        .from({ round: roundCollection })
        .where(({ round }) => eq(round.tripId, tripId)),
    [tripId]
  )

  const nextRoundNumber = (existingRounds?.length ?? 0) + 1

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const courseId = formData.get('courseId') as string
    const roundDate = new Date(formData.get('roundDate') as string)
    const notes = (formData.get('notes') as string) || ''

    const roundId = crypto.randomUUID()

    roundCollection.insert({
      id: roundId,
      tripId,
      courseId,
      roundDate,
      roundNumber: nextRoundNumber,
      notes,
    })

    navigate({
      to: '/trips/$tripId/rounds/$roundId',
      params: { tripId, roundId },
    })
  }

  if (!trip) {
    return (
      <Container size="2" py="6">
        <Text>Trip not found</Text>
      </Container>
    )
  }

  const defaultDate = trip.startDate.toISOString().split('T')[0]

  return (
    <Container size="1" py="6">
      <Flex direction="column" gap="5">
        <Flex direction="column" gap="1">
          <Heading size="7">New Round</Heading>
          <Text color="gray">{trip.name}</Text>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium" htmlFor="courseId">
                Course
              </Text>
              <Select.Root name="courseId" required>
                <Select.Trigger placeholder="Select a course" />
                <Select.Content>
                  {courses?.map((course) => (
                    <Select.Item key={course.id} value={course.id}>
                      {course.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
              {(!courses || courses.length === 0) && (
                <Text size="1" color="amber">
                  No courses available. Add courses to the database first.
                </Text>
              )}
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium" htmlFor="roundDate">
                Date
              </Text>
              <TextField.Root
                id="roundDate"
                name="roundDate"
                type="date"
                defaultValue={defaultDate}
                required
              />
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium" htmlFor="notes">
                Notes
              </Text>
              <TextArea
                id="notes"
                name="notes"
                placeholder="Weather conditions, memorable moments..."
              />
            </Flex>

            <Text size="2" color="gray">
              This will be Round {nextRoundNumber} of the trip
            </Text>

            <Button type="submit" disabled={!courses || courses.length === 0}>
              Create Round
            </Button>
          </Flex>
        </form>
      </Flex>
    </Container>
  )
}
