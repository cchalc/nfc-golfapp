import { Flex, Text, TextField, Card, Badge, Button, Spinner, Link } from '@radix-ui/themes'
import { Search, MapPin, Check, PenLine } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  searchCourses,
  getCourse,
  getAllTees,
  getPrimaryTee,
  isApiConfigured,
  type ApiCourse,
} from '../../lib/golfCourseApi'
import { useImportCourseWithDetails } from '../../hooks/queries'
import { CourseForm } from './CourseForm'

interface CourseSearchProps {
  onSuccess?: () => void
}

export function CourseSearch({ onSuccess }: CourseSearchProps) {
  const [mode, setMode] = useState<'search' | 'manual'>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ApiCourse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [importingId, setImportingId] = useState<number | null>(null)
  const [importedId, setImportedId] = useState<number | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const importMutation = useImportCourseWithDetails()

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setSearchError(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const courses = await searchCourses(query)
        console.log('Search results for', query, ':', courses.length, 'courses')
        setResults(courses)
        if (courses.length === 0) {
          setSearchError(`No courses found matching "${query}"`)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchError('Failed to search courses. Check console for details.')
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  async function handleImportCourse(apiCourse: ApiCourse) {
    setImportingId(apiCourse.id)
    setSearchError(null)

    try {
      // Fetch full course details
      const fullCourse = await getCourse(apiCourse.id)
      if (!fullCourse) {
        throw new Error('Failed to fetch course details')
      }

      // Get primary tee for default ratings
      const primaryTee = getPrimaryTee(fullCourse)
      const courseId = crypto.randomUUID()
      const location = fullCourse.location

      // Build course data
      const course = {
        id: courseId,
        apiId: fullCourse.id,
        name: fullCourse.course_name,
        clubName: fullCourse.club_name,
        location: `${location.city}, ${location.state}`,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        courseRating: primaryTee?.course_rating ?? null,
        slopeRating: primaryTee?.slope_rating ?? null,
        totalPar: primaryTee?.par_total ?? 72,
      }

      // Build tee box data
      const allTees = getAllTees(fullCourse)
      const teeBoxes = allTees.map((tee) => ({
        id: crypto.randomUUID(),
        courseId,
        teeName: tee.tee_name,
        gender: tee.gender as 'male' | 'female',
        courseRating: tee.course_rating,
        slopeRating: tee.slope_rating,
        totalYards: tee.total_yards,
        parTotal: tee.par_total,
      }))

      // Build hole data from primary tee (or first available with holes)
      const teesWithHoles = allTees.filter((t) => t.holes && t.holes.length > 0)
      const teeForHoles = teesWithHoles.find((t) => t.gender === 'male') || teesWithHoles[0]

      const holes = (teeForHoles?.holes || []).map((hole, i) => ({
        id: crypto.randomUUID(),
        courseId,
        holeNumber: i + 1,
        par: hole.par,
        strokeIndex: hole.handicap, // API uses 'handicap' for stroke index
        yardage: hole.yardage,
      }))

      // Import everything using mutation hook
      const result = await importMutation.mutateAsync({ course, teeBoxes, holes })

      console.log(
        `Imported course "${course.name}" with ${result.teeBoxCount} tee boxes and ${result.holeCount} holes`
      )

      setImportedId(apiCourse.id)
      // Brief delay before closing dialog
      setTimeout(() => {
        onSuccess?.()
      }, 500)
    } catch (error) {
      console.error('Failed to import course:', error)
      setSearchError('Failed to import course. Please try again.')
    } finally {
      setImportingId(null)
    }
  }

  const apiConfigured = isApiConfigured()

  // Manual entry mode
  if (mode === 'manual') {
    return (
      <Flex direction="column" gap="4">
        <CourseForm onSuccess={onSuccess} />
        <Flex justify="center">
          <Link
            size="2"
            color="gray"
            style={{ cursor: 'pointer' }}
            onClick={() => setMode('search')}
          >
            <Flex align="center" gap="1">
              <Search size={14} />
              Search for a course instead
            </Flex>
          </Link>
        </Flex>
      </Flex>
    )
  }

  // API not configured - show manual form with message
  if (!apiConfigured) {
    return (
      <Flex direction="column" gap="4">
        <Card>
          <Flex direction="column" gap="2" align="center" py="3">
            <Text size="2" color="amber" weight="medium">
              Course Search Not Available
            </Text>
            <Text size="1" color="gray">
              API key not configured. You can add courses manually below.
            </Text>
          </Flex>
        </Card>
        <CourseForm onSuccess={onSuccess} />
      </Flex>
    )
  }

  return (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="1">
        <Text as="label" size="2" weight="medium">
          Search Golf Courses
        </Text>
        <TextField.Root
          placeholder="Search by course name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
          {isSearching && (
            <TextField.Slot>
              <Spinner size="1" />
            </TextField.Slot>
          )}
        </TextField.Root>
        <Text size="1" color="gray">
          Search the Golf Course API database of 30,000+ courses
        </Text>
      </Flex>

      {results.length > 0 && (
        <Flex direction="column" gap="2" style={{ maxHeight: 400, overflowY: 'auto' }}>
          {results.map((course) => (
            <Card key={course.id} size="1">
              <Flex justify="between" align="start" gap="3">
                <Flex direction="column" gap="2">
                  <Text weight="medium" size="2">
                    {course.course_name}
                  </Text>
                  {course.club_name !== course.course_name && (
                    <Text size="1" color="gray">
                      {course.club_name}
                    </Text>
                  )}
                  <Flex align="center" gap="1">
                    <MapPin size={12} style={{ color: 'var(--gray-9)' }} />
                    <Text size="1" color="gray">
                      {course.location.city}, {course.location.state}
                    </Text>
                  </Flex>
                  <Flex gap="1" wrap="wrap">
                    {course.tees.male && course.tees.male.length > 0 && (
                      <Badge size="1" variant="soft" color="blue">
                        {course.tees.male.length} men's tees
                      </Badge>
                    )}
                    {course.tees.female && course.tees.female.length > 0 && (
                      <Badge size="1" variant="soft" color="pink">
                        {course.tees.female.length} women's tees
                      </Badge>
                    )}
                  </Flex>
                </Flex>

                <Button
                  size="1"
                  variant={importedId === course.id ? 'soft' : 'solid'}
                  color={importedId === course.id ? 'grass' : undefined}
                  disabled={importingId !== null}
                  onClick={() => handleImportCourse(course)}
                >
                  {importingId === course.id ? (
                    <Spinner size="1" />
                  ) : importedId === course.id ? (
                    <>
                      <Check size={14} />
                      Added
                    </>
                  ) : (
                    'Add'
                  )}
                </Button>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      {searchError && !isSearching && (
        <Card>
          <Flex align="center" justify="center" py="4">
            <Text size="2" color="gray">
              {searchError}
            </Text>
          </Flex>
        </Card>
      )}

      <Flex justify="center" pt="2">
        <Link
          size="2"
          color="gray"
          style={{ cursor: 'pointer' }}
          onClick={() => setMode('manual')}
        >
          <Flex align="center" gap="1">
            <PenLine size={14} />
            Add course manually
          </Flex>
        </Link>
      </Flex>
    </Flex>
  )
}
