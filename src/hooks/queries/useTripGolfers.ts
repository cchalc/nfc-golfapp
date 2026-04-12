import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTripGolfers, getTripGolfersByTripId, getTripGolferCounts } from '../../server/queries'
import { insertTripGolfer, updateTripGolfer, deleteTripGolfer } from '../../server/mutations'
import type { TripGolfer } from '../../db/collections'
import { tripKeys } from './useTrips'

export const tripGolferKeys = {
  all: ['tripGolfers'] as const,
  lists: () => [...tripGolferKeys.all, 'list'] as const,
  list: () => [...tripGolferKeys.lists()] as const,
  byTrip: (tripId: string) => [...tripGolferKeys.lists(), 'trip', tripId] as const,
  counts: () => [...tripGolferKeys.all, 'counts'] as const,
}

export function useTripGolfers() {
  return useQuery({
    queryKey: tripGolferKeys.list(),
    queryFn: () => getTripGolfers(),
  })
}

export function useTripGolfersByTripId(tripId: string) {
  return useQuery({
    queryKey: tripGolferKeys.byTrip(tripId),
    queryFn: () => getTripGolfersByTripId({ data: tripId }),
    enabled: !!tripId,
  })
}

export function useTripGolferCounts() {
  return useQuery({
    queryKey: tripGolferKeys.counts(),
    queryFn: () => getTripGolferCounts(),
  })
}

export function useCreateTripGolfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tripGolfer: TripGolfer) => insertTripGolfer({ data: tripGolfer }),
    onSuccess: (_, tripGolfer) => {
      queryClient.invalidateQueries({ queryKey: tripGolferKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tripGolferKeys.counts() })
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripGolfer.tripId) })
    },
  })
}

export function useUpdateTripGolfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<TripGolfer, 'id'>> }) =>
      updateTripGolfer({ data: { id, changes } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripGolferKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tripGolferKeys.counts() })
    },
  })
}

export function useDeleteTripGolfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTripGolfer({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripGolferKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tripGolferKeys.counts() })
    },
  })
}
