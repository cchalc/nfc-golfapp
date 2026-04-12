import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getScores, getScoresByRoundId } from '../../server/queries'
import { insertScore, updateScore, deleteScore } from '../../server/mutations'
import type { Score } from '../../db/collections'
import { roundSummaryKeys } from './useRoundSummaries'

export const scoreKeys = {
  all: ['scores'] as const,
  lists: () => [...scoreKeys.all, 'list'] as const,
  list: () => [...scoreKeys.lists()] as const,
  byRound: (roundId: string) => [...scoreKeys.lists(), 'round', roundId] as const,
}

export function useScores() {
  return useQuery({
    queryKey: scoreKeys.list(),
    queryFn: () => getScores(),
  })
}

export function useScoresByRoundId(roundId: string) {
  return useQuery({
    queryKey: scoreKeys.byRound(roundId),
    queryFn: () => getScoresByRoundId({ data: roundId }),
    enabled: !!roundId,
  })
}

export function useCreateScore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (score: Score) => insertScore({ data: score }),
    onSuccess: (_, score) => {
      queryClient.invalidateQueries({ queryKey: scoreKeys.lists() })
      queryClient.invalidateQueries({ queryKey: scoreKeys.byRound(score.roundId) })
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.byRound(score.roundId) })
    },
  })
}

export function useUpdateScore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<Score, 'id'>>; roundId: string }) =>
      updateScore({ data: { id, changes } }),
    onSuccess: (_, { roundId }) => {
      queryClient.invalidateQueries({ queryKey: scoreKeys.lists() })
      queryClient.invalidateQueries({ queryKey: scoreKeys.byRound(roundId) })
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.byRound(roundId) })
    },
  })
}

export function useDeleteScore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; roundId: string }) => deleteScore({ data: { id } }),
    onSuccess: (_, { roundId }) => {
      queryClient.invalidateQueries({ queryKey: scoreKeys.lists() })
      queryClient.invalidateQueries({ queryKey: scoreKeys.byRound(roundId) })
      queryClient.invalidateQueries({ queryKey: roundSummaryKeys.byRound(roundId) })
    },
  })
}
