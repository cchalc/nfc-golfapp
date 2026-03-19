import { Card, Flex, Text, Heading, Badge } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import { MapPin, Flag, ChevronRight } from 'lucide-react'
import type { Course } from '../../db/collections'

interface CourseCardProps {
  course: Course
  holeCount?: number
}

export function CourseCard({ course, holeCount = 0 }: CourseCardProps) {
  return (
    <Link
      to="/courses/$courseId"
      params={{ courseId: course.id }}
      style={{ textDecoration: 'none' }}
    >
      <Card className="card-gold-hover">
        <Flex justify="between" align="center">
          <Flex direction="column" gap="3">
            <Heading size="4">{course.name}</Heading>

            <Flex gap="4" wrap="wrap">
              {course.location && (
                <Flex align="center" gap="1">
                  <MapPin size={14} style={{ color: 'var(--grass-9)' }} />
                  <Text size="2" color="gray">
                    {course.location}
                  </Text>
                </Flex>
              )}
              <Flex align="center" gap="1">
                <Flag size={14} style={{ color: 'var(--grass-9)' }} />
                <Text size="2" color="gray">
                  Par {course.totalPar}
                </Text>
              </Flex>
            </Flex>

            <Flex gap="2">
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
              <Badge variant="soft" color="gray">
                {holeCount} holes
              </Badge>
            </Flex>
          </Flex>

          <ChevronRight size={20} style={{ color: 'var(--gray-9)' }} />
        </Flex>
      </Card>
    </Link>
  )
}
