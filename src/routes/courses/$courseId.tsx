import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Badge,
  Button,
  Dialog,
  AlertDialog,
  Table,
  TextField,
  Grid,
  Spinner,
} from '@radix-ui/themes'
import { ArrowLeft, MapPin, Flag, Edit, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useLiveQuery, eq } from '@tanstack/react-db'
import { courseCollection, holeCollection, teeBoxCollection, roundCollection } from '../../db/collections'
import { CourseForm } from '../../components/courses/CourseForm'
import { useDialogState } from '../../hooks/useDialogState'
import { getCourse, getAllTees, getPrimaryTee } from '../../lib/golfCourseApi'
import { resyncCourseDetails } from '../../server/mutations'

export const Route = createFileRoute('/courses/$courseId')({
  ssr: false,
  component: CourseDetailPage,
})

function CourseDetailPage() {
  const { courseId } = Route.useParams()
  const navigate = useNavigate()
  const [editDialogOpen, setEditDialogOpen] = useDialogState(`edit-course-${courseId}`)
  const [addHoleDialogOpen, setAddHoleDialogOpen] = useDialogState(`add-hole-${courseId}`)
  const [isResyncing, setIsResyncing] = useState(false)

  const { data: courses } = useLiveQuery(
    (q) => q.from({ course: courseCollection }).where(({ course }) => eq(course.id, courseId)),
    [courseId]
  )
  const course = courses?.[0]

  const { data: holes } = useLiveQuery(
    (q) =>
      q
        .from({ hole: holeCollection })
        .where(({ hole }) => eq(hole.courseId, courseId))
        .orderBy(({ hole }) => hole.holeNumber, 'asc'),
    [courseId]
  )

  const { data: teeBoxes } = useLiveQuery(
    (q) =>
      q
        .from({ tee: teeBoxCollection })
        .where(({ tee }) => eq(tee.courseId, courseId))
        .orderBy(({ tee }) => tee.totalYards, 'desc'),
    [courseId]
  )

  // Check if course is used by any rounds
  const { data: roundsUsingCourse } = useLiveQuery(
    (q) =>
      q
        .from({ round: roundCollection })
        .where(({ round }) => eq(round.courseId, courseId)),
    [courseId]
  )
  const isInUse = (roundsUsingCourse?.length ?? 0) > 0

  function handleAddHole(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const holeNumber = parseInt(formData.get('holeNumber') as string)
    const par = parseInt(formData.get('par') as string)
    const strokeIndex = parseInt(formData.get('strokeIndex') as string)
    const yardage = parseInt(formData.get('yardage') as string) || null

    holeCollection.insert({
      id: crypto.randomUUID(),
      courseId,
      holeNumber,
      par,
      strokeIndex,
      yardage,
    })

    setAddHoleDialogOpen(false)
  }

  function handleDeleteHole(holeId: string) {
    holeCollection.delete(holeId)
  }

  function handleGenerateHoles() {
    // Standard par distribution for 18 holes
    const pars = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5]
    const strokeIndices = [7, 15, 3, 11, 1, 13, 5, 9, 17, 8, 16, 4, 12, 2, 14, 6, 10, 18]

    for (let i = 0; i < 18; i++) {
      holeCollection.insert({
        id: crypto.randomUUID(),
        courseId,
        holeNumber: i + 1,
        par: pars[i],
        strokeIndex: strokeIndices[i],
        yardage: null,
      })
    }
  }

  function handleDeleteCourse() {
    courseCollection.delete(courseId)
    navigate({ to: '/courses' })
  }

  async function handleResyncCourse() {
    if (!course?.apiId) return

    setIsResyncing(true)
    try {
      // Fetch fresh data from API
      const fullCourse = await getCourse(course.apiId)
      if (!fullCourse) {
        throw new Error('Failed to fetch course details')
      }

      // Get primary tee for default ratings
      const primaryTee = getPrimaryTee(fullCourse)

      // Build course updates
      const courseUpdates = {
        name: fullCourse.course_name,
        clubName: fullCourse.club_name,
        courseRating: primaryTee?.course_rating ?? null,
        slopeRating: primaryTee?.slope_rating ?? null,
        totalPar: primaryTee?.par_total ?? 72,
      }

      // Build new tee boxes
      const allTees = getAllTees(fullCourse)
      const newTeeBoxes = allTees.map((tee) => ({
        id: crypto.randomUUID(),
        courseId,
        teeName: tee.tee_name,
        gender: tee.gender as 'male' | 'female',
        courseRating: tee.course_rating,
        slopeRating: tee.slope_rating,
        totalYards: tee.total_yards,
        parTotal: tee.par_total,
      }))

      // Build new holes
      const teesWithHoles = allTees.filter((t) => t.holes && t.holes.length > 0)
      const teeForHoles = teesWithHoles.find((t) => t.gender === 'male') || teesWithHoles[0]
      const newHoles = (teeForHoles?.holes || []).map((hole, i) => ({
        id: crypto.randomUUID(),
        courseId,
        holeNumber: i + 1,
        par: hole.par,
        strokeIndex: hole.handicap,
        yardage: hole.yardage,
      }))

      // Resync via batched transaction (deletes old, inserts new)
      const result = await resyncCourseDetails({
        data: { courseId, courseUpdates, teeBoxes: newTeeBoxes, holes: newHoles },
      })

      console.log(`Resynced course with ${result.teeBoxCount} tee boxes and ${result.holeCount} holes (txid: ${result.txid})`)
    } catch (error) {
      console.error('Failed to resync course:', error)
    } finally {
      setIsResyncing(false)
    }
  }

  if (!course) {
    return (
      <Container size="2" py="6">
        <Flex direction="column" gap="4" align="center">
          <Text color="gray">Course not found</Text>
          <Link to="/courses">
            <Button variant="soft">
              <ArrowLeft size={16} />
              Back to Courses
            </Button>
          </Link>
        </Flex>
      </Container>
    )
  }

  const holeList = holes || []
  const totalPar = holeList.reduce((sum, h) => sum + h.par, 0)
  const frontNine = holeList.filter((h) => h.holeNumber <= 9)
  const backNine = holeList.filter((h) => h.holeNumber > 9)

  return (
    <Container size="2" py="6">
      <Flex direction="column" gap="6">
        {/* Back button */}
        <Link to="/courses">
          <Button variant="ghost" size="1">
            <ArrowLeft size={16} />
            Back to Courses
          </Button>
        </Link>

        {/* Course header */}
        <Card>
          <Flex justify="between" align="start">
            <Flex direction="column" gap="3">
              <Heading size="6">{course.name}</Heading>
              {course.location && (
                <Flex align="center" gap="1">
                  <MapPin size={14} style={{ color: 'var(--grass-9)' }} />
                  <Text color="gray">{course.location}</Text>
                </Flex>
              )}
              <Flex gap="2" wrap="wrap">
                <Badge color="grass">Par {course.totalPar}</Badge>
                {course.courseRating && (
                  <Badge variant="soft" color="blue">
                    Rating: {course.courseRating}
                  </Badge>
                )}
                {course.slopeRating && (
                  <Badge variant="soft" color="amber">
                    Slope: {course.slopeRating}
                  </Badge>
                )}
              </Flex>
            </Flex>

            <Flex gap="2">
              {/* Resync button - only show if course has API ID */}
              {course.apiId && (
                <Button
                  variant="soft"
                  size="1"
                  onClick={handleResyncCourse}
                  disabled={isResyncing}
                >
                  {isResyncing ? <Spinner size="1" /> : <RefreshCw size={14} />}
                  Resync
                </Button>
              )}

              <Dialog.Root open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <Dialog.Trigger>
                  <Button variant="soft" size="1">
                    <Edit size={14} />
                    Edit
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content maxWidth="450px">
                  <Dialog.Title>Edit Course</Dialog.Title>
                  <Flex direction="column" gap="4" pt="4">
                    <CourseForm
                      courseId={course.id}
                      initialData={course}
                      onSuccess={() => setEditDialogOpen(false)}
                    />
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>

              {/* Delete button - only if not used by any rounds */}
              <AlertDialog.Root>
                <AlertDialog.Trigger>
                  <Button
                    variant="soft"
                    color="red"
                    size="1"
                    disabled={isInUse}
                    title={isInUse ? 'Course is used by rounds and cannot be deleted' : 'Delete course'}
                  >
                    <Trash2 size={14} />
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content maxWidth="450px">
                  <AlertDialog.Title>Delete Course</AlertDialog.Title>
                  <AlertDialog.Description size="2">
                    Are you sure you want to delete "{course.name}"? This will also delete all
                    hole and tee box data. This action cannot be undone.
                  </AlertDialog.Description>
                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button variant="soft" color="gray">
                        Cancel
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button variant="solid" color="red" onClick={handleDeleteCourse}>
                        Delete Course
                      </Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>
            </Flex>
          </Flex>
        </Card>

        {/* Usage warning */}
        {isInUse && (
          <Card>
            <Flex align="center" gap="2" py="1">
              <Badge color="amber" variant="soft">In Use</Badge>
              <Text size="2" color="gray">
                This course is used by {roundsUsingCourse?.length} round(s) and cannot be deleted.
              </Text>
            </Flex>
          </Card>
        )}

        {/* Tee Boxes section */}
        {teeBoxes && teeBoxes.length > 0 && (
          <Flex direction="column" gap="3">
            <Heading size="4">Tee Boxes</Heading>
            <Card>
              <Table.Root size="1">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Tee</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Rating</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Slope</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Par</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Yards</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {teeBoxes.map((tee) => (
                    <Table.Row key={tee.id}>
                      <Table.Cell>
                        <Flex align="center" gap="2">
                          <Text weight="medium">{tee.teeName}</Text>
                          <Badge size="1" variant="soft" color={tee.gender === 'male' ? 'blue' : 'pink'}>
                            {tee.gender === 'male' ? 'M' : 'W'}
                          </Badge>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>{tee.courseRating.toFixed(1)}</Table.Cell>
                      <Table.Cell>{tee.slopeRating}</Table.Cell>
                      <Table.Cell>{tee.parTotal}</Table.Cell>
                      <Table.Cell>{tee.totalYards.toLocaleString()}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card>
          </Flex>
        )}

        {/* Holes section */}
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Flex align="center" gap="2">
              <Flag size={18} style={{ color: 'var(--grass-9)' }} />
              <Heading size="4">Holes</Heading>
              {holeList.length > 0 && (
                <Badge variant="soft" color="gray">
                  {holeList.length} holes • Par {totalPar}
                </Badge>
              )}
            </Flex>

            <Flex gap="2">
              {holeList.length === 0 && (
                <Button variant="soft" size="1" onClick={handleGenerateHoles}>
                  Generate 18 Holes
                </Button>
              )}
              <Dialog.Root open={addHoleDialogOpen} onOpenChange={setAddHoleDialogOpen}>
                <Dialog.Trigger>
                  <Button size="1">
                    <Plus size={14} />
                    Add Hole
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content maxWidth="350px">
                  <Dialog.Title>Add Hole</Dialog.Title>
                  <form onSubmit={handleAddHole}>
                    <Flex direction="column" gap="4" pt="4">
                      <Grid columns="2" gap="3">
                        <Flex direction="column" gap="1">
                          <Text as="label" size="2" weight="medium">
                            Hole #
                          </Text>
                          <TextField.Root
                            name="holeNumber"
                            type="number"
                            min="1"
                            max="18"
                            defaultValue={(holeList.length + 1).toString()}
                            required
                          />
                        </Flex>
                        <Flex direction="column" gap="1">
                          <Text as="label" size="2" weight="medium">
                            Par
                          </Text>
                          <TextField.Root
                            name="par"
                            type="number"
                            min="3"
                            max="5"
                            defaultValue="4"
                            required
                          />
                        </Flex>
                        <Flex direction="column" gap="1">
                          <Text as="label" size="2" weight="medium">
                            Stroke Index
                          </Text>
                          <TextField.Root
                            name="strokeIndex"
                            type="number"
                            min="1"
                            max="18"
                            defaultValue={(holeList.length + 1).toString()}
                            required
                          />
                        </Flex>
                        <Flex direction="column" gap="1">
                          <Text as="label" size="2" weight="medium">
                            Yardage
                          </Text>
                          <TextField.Root name="yardage" type="number" placeholder="Optional" />
                        </Flex>
                      </Grid>
                      <Button type="submit">Add Hole</Button>
                    </Flex>
                  </form>
                </Dialog.Content>
              </Dialog.Root>
            </Flex>
          </Flex>

          {holeList.length > 0 ? (
            <Flex direction="column" gap="4">
              {/* Front Nine */}
              {frontNine.length > 0 && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Text size="2" weight="medium" color="gray">
                      Front Nine
                    </Text>
                    <Table.Root size="1">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>Hole</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Par</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>S.I.</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Yards</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell width="40px"></Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {frontNine.map((hole) => (
                          <Table.Row key={hole.id}>
                            <Table.Cell>
                              <Badge>{hole.holeNumber}</Badge>
                            </Table.Cell>
                            <Table.Cell>{hole.par}</Table.Cell>
                            <Table.Cell>{hole.strokeIndex}</Table.Cell>
                            <Table.Cell>{hole.yardage || '-'}</Table.Cell>
                            <Table.Cell>
                              <Button
                                variant="ghost"
                                size="1"
                                color="red"
                                onClick={() => handleDeleteHole(hole.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                        <Table.Row>
                          <Table.Cell>
                            <Text weight="bold">Out</Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Text weight="bold">{frontNine.reduce((s, h) => s + h.par, 0)}</Text>
                          </Table.Cell>
                          <Table.Cell></Table.Cell>
                          <Table.Cell>
                            {frontNine.some((h) => h.yardage) && (
                              <Text weight="bold">
                                {frontNine.reduce((s, h) => s + (h.yardage || 0), 0)}
                              </Text>
                            )}
                          </Table.Cell>
                          <Table.Cell></Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Root>
                  </Flex>
                </Card>
              )}

              {/* Back Nine */}
              {backNine.length > 0 && (
                <Card>
                  <Flex direction="column" gap="3">
                    <Text size="2" weight="medium" color="gray">
                      Back Nine
                    </Text>
                    <Table.Root size="1">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeaderCell>Hole</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Par</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>S.I.</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell>Yards</Table.ColumnHeaderCell>
                          <Table.ColumnHeaderCell width="40px"></Table.ColumnHeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {backNine.map((hole) => (
                          <Table.Row key={hole.id}>
                            <Table.Cell>
                              <Badge>{hole.holeNumber}</Badge>
                            </Table.Cell>
                            <Table.Cell>{hole.par}</Table.Cell>
                            <Table.Cell>{hole.strokeIndex}</Table.Cell>
                            <Table.Cell>{hole.yardage || '-'}</Table.Cell>
                            <Table.Cell>
                              <Button
                                variant="ghost"
                                size="1"
                                color="red"
                                onClick={() => handleDeleteHole(hole.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                        <Table.Row>
                          <Table.Cell>
                            <Text weight="bold">In</Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Text weight="bold">{backNine.reduce((s, h) => s + h.par, 0)}</Text>
                          </Table.Cell>
                          <Table.Cell></Table.Cell>
                          <Table.Cell>
                            {backNine.some((h) => h.yardage) && (
                              <Text weight="bold">
                                {backNine.reduce((s, h) => s + (h.yardage || 0), 0)}
                              </Text>
                            )}
                          </Table.Cell>
                          <Table.Cell></Table.Cell>
                        </Table.Row>
                      </Table.Body>
                    </Table.Root>
                  </Flex>
                </Card>
              )}
            </Flex>
          ) : (
            <Card>
              <Flex direction="column" align="center" gap="3" py="6">
                <Text color="gray">No holes added yet</Text>
                <Flex gap="2">
                  <Button variant="soft" onClick={handleGenerateHoles}>
                    Generate 18 Holes
                  </Button>
                  <Dialog.Root open={addHoleDialogOpen} onOpenChange={setAddHoleDialogOpen}>
                    <Dialog.Trigger>
                      <Button>
                        <Plus size={14} />
                        Add Manually
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Content maxWidth="350px">
                      <Dialog.Title>Add Hole</Dialog.Title>
                      <form onSubmit={handleAddHole}>
                        <Flex direction="column" gap="4" pt="4">
                          <Grid columns="2" gap="3">
                            <Flex direction="column" gap="1">
                              <Text as="label" size="2" weight="medium">
                                Hole #
                              </Text>
                              <TextField.Root
                                name="holeNumber"
                                type="number"
                                min="1"
                                max="18"
                                defaultValue="1"
                                required
                              />
                            </Flex>
                            <Flex direction="column" gap="1">
                              <Text as="label" size="2" weight="medium">
                                Par
                              </Text>
                              <TextField.Root
                                name="par"
                                type="number"
                                min="3"
                                max="5"
                                defaultValue="4"
                                required
                              />
                            </Flex>
                            <Flex direction="column" gap="1">
                              <Text as="label" size="2" weight="medium">
                                Stroke Index
                              </Text>
                              <TextField.Root
                                name="strokeIndex"
                                type="number"
                                min="1"
                                max="18"
                                defaultValue="1"
                                required
                              />
                            </Flex>
                            <Flex direction="column" gap="1">
                              <Text as="label" size="2" weight="medium">
                                Yardage
                              </Text>
                              <TextField.Root name="yardage" type="number" placeholder="Optional" />
                            </Flex>
                          </Grid>
                          <Button type="submit">Add Hole</Button>
                        </Flex>
                      </form>
                    </Dialog.Content>
                  </Dialog.Root>
                </Flex>
              </Flex>
            </Card>
          )}
        </Flex>
      </Flex>
    </Container>
  )
}
