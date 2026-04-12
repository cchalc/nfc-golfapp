import { createFileRoute } from '@tanstack/react-router'
import { Container, Flex, Heading, Button, Dialog } from '@radix-ui/themes'
import { Plus } from 'lucide-react'
import { useCourses, useHoles } from '../../hooks/queries'
import { CourseCard } from '../../components/courses/CourseCard'
import { CourseSearch } from '../../components/courses/CourseSearch'
import { EmptyState } from '../../components/ui/EmptyState'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useDialogState } from '../../hooks/useDialogState'
import { useRequireAuth } from '../../hooks/useRequireAuth'

export const Route = createFileRoute('/courses/')({
  ssr: false,
  component: CoursesPage,
})

function CoursesPage() {
  useRequireAuth()
  const [addDialogOpen, setAddDialogOpen] = useDialogState('add-course')

  const { data: courses, isLoading: coursesLoading } = useCourses()

  // Get hole counts for each course
  const { data: holes } = useHoles()

  const holeCountByCourse = new Map<string, number>()
  for (const hole of holes || []) {
    const count = holeCountByCourse.get(hole.courseId) || 0
    holeCountByCourse.set(hole.courseId, count + 1)
  }

  // Sort courses by name
  const sortedCourses = courses
    ? [...courses].sort((a, b) => a.name.localeCompare(b.name))
    : []

  if (coursesLoading) {
    return (
      <Container size="2" py="6">
        <Flex direction="column" gap="4">
          <Heading size="7">Courses</Heading>
          <Flex direction="column" gap="3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </Flex>
        </Flex>
      </Container>
    )
  }

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="7">Courses</Heading>
          <Dialog.Root open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <Dialog.Trigger>
              <Button color="grass">
                <Plus size={16} />
                Add Course
              </Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="450px">
              <Dialog.Title>Add Course</Dialog.Title>
              <Dialog.Description size="2" color="gray">
                Add a new golf course to your collection
              </Dialog.Description>
              <Flex direction="column" gap="4" pt="4">
                <CourseSearch onSuccess={() => setAddDialogOpen(false)} />
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        {sortedCourses.length > 0 ? (
          <Flex direction="column" gap="2">
            {sortedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                holeCount={holeCountByCourse.get(course.id) || 0}
              />
            ))}
          </Flex>
        ) : (
          <EmptyState
            title="No courses yet"
            description="Add courses to use when creating rounds"
            action={
              <Dialog.Root open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <Dialog.Trigger>
                  <Button color="grass">
                    <Plus size={16} />
                    Add Course
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content maxWidth="450px">
                  <Dialog.Title>Add Course</Dialog.Title>
                  <Dialog.Description size="2" color="gray">
                    Search the Golf Course API to add a course
                  </Dialog.Description>
                  <Flex direction="column" gap="4" pt="4">
                    <CourseSearch onSuccess={() => setAddDialogOpen(false)} />
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>
            }
          />
        )}
      </Flex>
    </Container>
  )
}
