import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCourses, getCourse, getTeeBoxesByCourseId, getHoles, getHolesByCourseId } from '../../server/queries'
import { insertCourse, updateCourse, deleteCourse, insertTeeBox, updateTeeBox, deleteTeeBox, insertHole, updateHole, deleteHole } from '../../server/mutations'
import { importCourseWithDetails } from '../../server/mutations/course-import'
import type { Course, TeeBox, Hole } from '../../db/collections'

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: () => [...courseKeys.lists()] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
}

export const teeBoxKeys = {
  all: ['teeBoxes'] as const,
  byCourse: (courseId: string) => [...teeBoxKeys.all, 'course', courseId] as const,
}

export const holeKeys = {
  all: ['holes'] as const,
  lists: () => [...holeKeys.all, 'list'] as const,
  list: () => [...holeKeys.lists()] as const,
  byCourse: (courseId: string) => [...holeKeys.all, 'course', courseId] as const,
}

export function useCourses() {
  return useQuery({
    queryKey: courseKeys.list(),
    queryFn: () => getCourses(),
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => getCourse({ data: id }),
    enabled: !!id,
  })
}

export function useTeeBoxesByCourseId(courseId: string) {
  return useQuery({
    queryKey: teeBoxKeys.byCourse(courseId),
    queryFn: () => getTeeBoxesByCourseId({ data: courseId }),
    enabled: !!courseId,
  })
}

export function useHoles() {
  return useQuery({
    queryKey: holeKeys.list(),
    queryFn: () => getHoles(),
  })
}

export function useHolesByCourseId(courseId: string) {
  return useQuery({
    queryKey: holeKeys.byCourse(courseId),
    queryFn: () => getHolesByCourseId({ data: courseId }),
    enabled: !!courseId,
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (course: Course) => insertCourse({ data: course }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<Course, 'id'>> }) =>
      updateCourse({ data: { id, changes } }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCourse({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
    },
  })
}

export function useCreateTeeBox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teeBox: TeeBox) => insertTeeBox({ data: teeBox }),
    onSuccess: (_, teeBox) => {
      queryClient.invalidateQueries({ queryKey: teeBoxKeys.byCourse(teeBox.courseId) })
    },
  })
}

export function useUpdateTeeBox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes, courseId: _courseId }: { id: string; changes: Partial<Omit<TeeBox, 'id'>>; courseId: string }) =>
      updateTeeBox({ data: { id, changes } }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: teeBoxKeys.byCourse(courseId) })
    },
  })
}

export function useDeleteTeeBox() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, courseId: _courseId }: { id: string; courseId: string }) => deleteTeeBox({ data: { id } }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: teeBoxKeys.byCourse(courseId) })
    },
  })
}

export function useCreateHole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (hole: Hole) => insertHole({ data: hole }),
    onSuccess: (_, hole) => {
      queryClient.invalidateQueries({ queryKey: holeKeys.byCourse(hole.courseId) })
      queryClient.invalidateQueries({ queryKey: holeKeys.lists() })
    },
  })
}

export function useUpdateHole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes, courseId: _courseId }: { id: string; changes: Partial<Omit<Hole, 'id'>>; courseId: string }) =>
      updateHole({ data: { id, changes } }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: holeKeys.byCourse(courseId) })
      queryClient.invalidateQueries({ queryKey: holeKeys.lists() })
    },
  })
}

export function useDeleteHole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, courseId: _courseId }: { id: string; courseId: string }) => deleteHole({ data: { id } }),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: holeKeys.byCourse(courseId) })
      queryClient.invalidateQueries({ queryKey: holeKeys.lists() })
    },
  })
}

interface CourseImportData {
  course: Course
  teeBoxes: TeeBox[]
  holes: Hole[]
}

export function useImportCourseWithDetails() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CourseImportData) => importCourseWithDetails({ data }),
    onSuccess: (_, { course }) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(course.id) })
      queryClient.invalidateQueries({ queryKey: teeBoxKeys.byCourse(course.id) })
      queryClient.invalidateQueries({ queryKey: holeKeys.byCourse(course.id) })
      queryClient.invalidateQueries({ queryKey: holeKeys.lists() })
    },
  })
}
