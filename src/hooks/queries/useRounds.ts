import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRounds, getRoundsByTripId, getRound } from '../../server/queries'
import { insertRound, updateRound, deleteRound } from '../../server/mutations'
import type { Round } from '../../db/collections'
import { tripKeys } from './useTrips'

export const roundKeys = {
  all: ['rounds'] as const,
  lists: () => [...roundKeys.all, 'list'] as const,
  list: () => [...roundKeys.lists()] as const,
  byTrip: (tripId: string) => [...roundKeys.lists(), 'trip', tripId] as const,
  details: () => [...roundKeys.all, 'detail'] as const,
  detail: (id: string) => [...roundKeys.details(), id] as const,
}

export function useRounds() {
  return useQuery({
    queryKey: roundKeys.list(),
    queryFn: () => getRounds(),
  })
}

export function useRoundsByTripId(tripId: string) {
  return useQuery({
    queryKey: roundKeys.byTrip(tripId),
    queryFn: () => getRoundsByTripId({ data: tripId }),
    enabled: !!tripId,
  })
}

export function useRound(id: string) {
  return useQuery({
    queryKey: roundKeys.detail(id),
    queryFn: () => getRound({ data: id }),
    enabled: !!id,
  })
}

export function useCreateRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (round: Round) => insertRound({ data: round }),
    onSuccess: (_, round) => {
      queryClient.invalidateQueries({ queryKey: roundKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roundKeys.byTrip(round.tripId) })
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(round.tripId) })
    },
  })
}

export function useUpdateRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<Round, 'id'>>; tripId: string }) =>
      updateRound({ data: { id, changes } }),
    onSuccess: (_, { id, tripId }) => {
      queryClient.invalidateQueries({ queryKey: roundKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: roundKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roundKeys.byTrip(tripId) })
    },
  })
}

export function useDeleteRound() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tripId: string }) => deleteRound({ data: { id } }),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: roundKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roundKeys.byTrip(tripId) })
    },
  })
}
