import { useEffect, useMemo, useRef } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { useAuth } from '../../contexts/AuthContext'
import { tripCollection } from '../../db/collections'
import {
  getOrCreateTripCollections,
  releaseTripCollections,
  type TripCollections,
} from '../../db/trip-collections'
import {
  DEFAULT_MAX_WARM_TRIPS,
  DEFAULT_MONTH_WINDOW,
  WARM_FULL_DATASET,
  selectLikelyTripIds,
} from '../../lib/trip-warmup'

interface TripMeta {
  id: string
  startDate: Date
  endDate: Date
}

function TripWarmQueries({
  tripId,
  collections,
}: {
  tripId: string
  collections: TripCollections
}) {
  // Critical warm set
  useLiveQuery(
    (q) => q.from({ tg: collections.tripGolfers }).select(({ tg }) => ({ id: tg.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ g: collections.golfers }).select(({ g }) => ({ id: g.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ r: collections.rounds }).select(({ r }) => ({ id: r.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ rs: collections.roundSummaries }).select(({ rs }) => ({ id: rs.id })),
    [tripId, collections]
  )

  // Full warm set for prototype scale.
  useLiveQuery(
    (q) => q.from({ s: collections.scores }).select(({ s }) => ({ id: s.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ c: collections.courses }).select(({ c }) => ({ id: c.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ h: collections.holes }).select(({ h }) => ({ id: h.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ t: collections.teams }).select(({ t }) => ({ id: t.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ tm: collections.teamMembers }).select(({ tm }) => ({ id: tm.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ ch: collections.challenges }).select(({ ch }) => ({ id: ch.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ cr: collections.challengeResults }).select(({ cr }) => ({ id: cr.id })),
    [tripId, collections]
  )

  return null
}

function TripWarmCriticalQueries({
  tripId,
  collections,
}: {
  tripId: string
  collections: TripCollections
}) {
  useLiveQuery(
    (q) => q.from({ tg: collections.tripGolfers }).select(({ tg }) => ({ id: tg.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ g: collections.golfers }).select(({ g }) => ({ id: g.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ r: collections.rounds }).select(({ r }) => ({ id: r.id })),
    [tripId, collections]
  )
  useLiveQuery(
    (q) => q.from({ rs: collections.roundSummaries }).select(({ rs }) => ({ id: rs.id })),
    [tripId, collections]
  )

  return null
}

function TripWarmupLoader({ tripId }: { tripId: string }) {
  const startedAtRef = useRef<number>(Date.now())
  const collections = useMemo(() => getOrCreateTripCollections(tripId), [tripId])

  useEffect(() => {
    startedAtRef.current = Date.now()
    console.debug('[TripWarmup] Started', { tripId })

    return () => {
      const durationMs = Date.now() - startedAtRef.current
      console.debug('[TripWarmup] Released', { tripId, durationMs })
      releaseTripCollections(tripId)
    }
  }, [tripId])

  if (WARM_FULL_DATASET) {
    return <TripWarmQueries tripId={tripId} collections={collections} />
  }

  return <TripWarmCriticalQueries tripId={tripId} collections={collections} />
}

export function TripWarmupManager() {
  const { isLoading: authLoading, isAuthenticated } = useAuth()
  const { data: trips } = useLiveQuery(
    (q) =>
      q.from({ trip: tripCollection }).select(({ trip }) => ({
        id: trip.id,
        startDate: trip.startDate,
        endDate: trip.endDate,
      })),
    []
  )

  const likelyTripIds = useMemo(
    () =>
      selectLikelyTripIds((trips || []) as TripMeta[], new Date(), {
        monthsWindow: DEFAULT_MONTH_WINDOW,
        maxTrips: DEFAULT_MAX_WARM_TRIPS,
      }),
    [trips]
  )

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.debug('[TripWarmup] Selected trips', {
        tripIds: likelyTripIds,
        monthWindow: DEFAULT_MONTH_WINDOW,
        maxTrips: DEFAULT_MAX_WARM_TRIPS,
        fullDataset: WARM_FULL_DATASET,
      })
    }
  }, [authLoading, isAuthenticated, likelyTripIds])

  if (authLoading || !isAuthenticated) return null

  return (
    <>
      {likelyTripIds.map((tripId) => (
        <TripWarmupLoader key={tripId} tripId={tripId} />
      ))}
    </>
  )
}
