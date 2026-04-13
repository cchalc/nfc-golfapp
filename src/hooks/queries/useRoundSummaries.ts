import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoundSummaries, getRoundSummariesByRoundId, getRoundSummariesByTripId } from '../../server/queries'
import { insertRoundSummary, updateRoundSummary, deleteRoundSummary } from '../../server/mutations'
import type { RoundSummary } from '../../db/collections'

export const roundSummaryKeys = {
  all: ['roundSummaries'] as const,
  lists: () => [...roundSummaryKeys.all, 'list'] as const,
  list: () => [...roundSummaryKeys.lists()] as const,
  byRound: (roundId: string) => [...roundSummaryKeys.lists(), 'round', roundId] as const,
  byTrip: (tripId: string) => [...roundSummaryKeys.lists(), 'trip', tripId] as const,
}

export function useRoundSummaries() {
  return useQuery({
    queryKey: roundSummaryKeys.list(),
    queryFn: () => getRoundSummaries(),
  })
}

export function useRoundSummariesByRoundId(roundId: string) {
  return useQuery({
    queryKey: roundSummaryKeys.byRound(roundId),
    queryFn: () => getRoundSummariesByRoundId({ data: roundId }),
    enabled: !!roundId,
  })
}

export function useRoundSummariesByTripId(tripId: string) {
  return useQuery({
    queryKey: roundSummaryKeys.byTrip(tripId),
    queryFn: () => getRoundSummariesByTripId({ data: tripId }),
    enabled: !!tripId,
  })
}

export function useCreateRoundSummary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (summary: RoundSummary) => insertRoundSummary({ data: summary }),
    onSuccess: (_, summary) => {
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.byRound(summary.roundId) })
    },
  })
}

export function useUpdateRoundSummary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<RoundSummary, 'id'>>; roundId: string }) =>
      updateRoundSummary({ data: { id, changes } }),
    onSuccess: (_, { roundId }) => {
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.byRound(roundId) })
    },
  })
}

export function useDeleteRoundSummary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; roundId: string }) => deleteRoundSummary({ data: { id } }),
    onSuccess: (_, { roundId }) => {
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.byRound(roundId) })
    },
  })
}
