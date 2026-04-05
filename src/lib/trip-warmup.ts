import type { Trip } from '../db/collections'

export const DEFAULT_MONTH_WINDOW = 6
export const DEFAULT_MAX_WARM_TRIPS = 6
export const WARM_FULL_DATASET = true

interface SelectLikelyTripsOptions {
  monthsWindow?: number
  maxTrips?: number
}

interface RankedTrip {
  id: string
  rank: number
  distanceMs: number
  startMs: number
}

function addMonths(base: Date, months: number) {
  const next = new Date(base)
  next.setMonth(next.getMonth() + months)
  return next
}

function inWindow(dateMs: number, windowStartMs: number, windowEndMs: number) {
  return dateMs >= windowStartMs && dateMs <= windowEndMs
}

function rankTrip(
  trip: Pick<Trip, 'id' | 'startDate' | 'endDate'>,
  nowMs: number,
  windowStartMs: number,
  windowEndMs: number
): RankedTrip | null {
  const startMs = new Date(trip.startDate).getTime()
  const endMs = new Date(trip.endDate).getTime()

  // Include trips that overlap with the date window by start or end.
  const overlapsWindow =
    inWindow(startMs, windowStartMs, windowEndMs) ||
    inWindow(endMs, windowStartMs, windowEndMs)

  if (!overlapsWindow) return null

  if (startMs <= nowMs && endMs >= nowMs) {
    return { id: trip.id, rank: 0, distanceMs: 0, startMs }
  }

  if (startMs > nowMs) {
    return { id: trip.id, rank: 1, distanceMs: startMs - nowMs, startMs }
  }

  return { id: trip.id, rank: 2, distanceMs: nowMs - endMs, startMs }
}

/**
 * Select a stable, date-based list of likely trip IDs for eager warmup.
 * Ranking:
 * 1) active trips, 2) nearest upcoming trips, 3) nearest recent past trips.
 */
export function selectLikelyTripIds(
  trips: Array<Pick<Trip, 'id' | 'startDate' | 'endDate'>>,
  now = new Date(),
  options: SelectLikelyTripsOptions = {}
): string[] {
  const monthsWindow = options.monthsWindow ?? DEFAULT_MONTH_WINDOW
  const maxTrips = options.maxTrips ?? DEFAULT_MAX_WARM_TRIPS
  const nowMs = now.getTime()
  const windowStartMs = addMonths(now, -monthsWindow).getTime()
  const windowEndMs = addMonths(now, monthsWindow).getTime()

  const ranked = trips
    .map((trip) => rankTrip(trip, nowMs, windowStartMs, windowEndMs))
    .filter((trip): trip is RankedTrip => trip !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank
      if (a.distanceMs !== b.distanceMs) return a.distanceMs - b.distanceMs
      if (a.startMs !== b.startMs) return b.startMs - a.startMs
      return a.id.localeCompare(b.id)
    })
    .slice(0, maxTrips)

  return ranked.map((trip) => trip.id)
}
