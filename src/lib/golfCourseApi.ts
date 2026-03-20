/**
 * Golf Course API service
 * API Documentation: https://api.golfcourseapi.com/docs/api/
 */

const API_BASE = 'https://api.golfcourseapi.com/v1'
const API_KEY = import.meta.env.VITE_GOLF_COURSE_API_KEY

// Debug: Log API key status at module load
console.log('Golf Course API Key configured:', API_KEY ? 'Yes (length: ' + API_KEY.length + ')' : 'NO - check .env file')

export function isApiConfigured(): boolean {
  return !!API_KEY
}

// API Response Types
export interface ApiHole {
  par: number
  yardage: number
  handicap: number // stroke index
}

export interface ApiTee {
  tee_name: string
  course_rating: number
  slope_rating: number
  bogey_rating?: number
  total_yards: number
  total_meters?: number
  number_of_holes: number
  par_total: number
  front_course_rating?: number
  front_slope_rating?: number
  back_course_rating?: number
  back_slope_rating?: number
  holes: ApiHole[]
}

export interface ApiLocation {
  address: string
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export interface ApiCourse {
  id: number
  club_name: string
  course_name: string
  location: ApiLocation
  tees: {
    male?: ApiTee[]
    female?: ApiTee[]
  }
}

export interface SearchResponse {
  courses: ApiCourse[]
}

export interface CourseResponse {
  course: ApiCourse
}

/**
 * Search for golf courses by name
 */
export async function searchCourses(query: string): Promise<ApiCourse[]> {
  if (!API_KEY) {
    console.error('Golf Course API key not configured. Set VITE_GOLF_COURSE_API_KEY in .env file.')
    throw new Error('API key not configured')
  }

  if (!query || query.length < 2) {
    return []
  }

  const url = `${API_BASE}/search?search_query=${encodeURIComponent(query)}`
  console.log('Searching Golf Course API:', url)

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Key ${API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error response:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data: SearchResponse = await response.json()
    console.log('API returned', data.courses?.length || 0, 'courses')
    return data.courses || []
  } catch (error) {
    console.error('Failed to search courses:', error)
    throw error
  }
}

/**
 * Fetch full course details by ID
 */
export async function getCourse(courseId: number): Promise<ApiCourse | null> {
  if (!API_KEY) {
    console.error('Golf Course API key not configured')
    return null
  }

  try {
    const response = await fetch(`${API_BASE}/courses/${courseId}`, {
      headers: {
        Authorization: `Key ${API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data: CourseResponse = await response.json()
    return data.course || null
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return null
  }
}

/**
 * Get the primary tee box for scoring (typically men's middle tee or first available)
 */
export function getPrimaryTee(course: ApiCourse): ApiTee | null {
  const maleTees = course.tees.male || []
  const femaleTees = course.tees.female || []

  // Prefer men's tees, look for "White" or middle option
  if (maleTees.length > 0) {
    const whiteTee = maleTees.find((t) => t.tee_name.toLowerCase() === 'white')
    if (whiteTee) return whiteTee
    // Return middle tee if multiple, otherwise first
    return maleTees[Math.floor(maleTees.length / 2)] || maleTees[0]
  }

  // Fall back to women's tees
  if (femaleTees.length > 0) {
    return femaleTees[0]
  }

  return null
}

/**
 * Get all tee boxes from a course
 */
export function getAllTees(course: ApiCourse): Array<ApiTee & { gender: 'male' | 'female' }> {
  const result: Array<ApiTee & { gender: 'male' | 'female' }> = []

  for (const tee of course.tees.male || []) {
    result.push({ ...tee, gender: 'male' })
  }
  for (const tee of course.tees.female || []) {
    result.push({ ...tee, gender: 'female' })
  }

  return result
}
