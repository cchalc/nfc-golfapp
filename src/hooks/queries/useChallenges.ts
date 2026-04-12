import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getChallenges, getChallengesByTripId, getChallengeResults, getChallengeResultsByTripId } from '../../server/queries'
import { insertChallenge, updateChallenge, deleteChallenge, insertChallengeResult, updateChallengeResult, deleteChallengeResult } from '../../server/mutations'
import type { Challenge, ChallengeResult } from '../../db/collections'
import { tripKeys } from './useTrips'

export const challengeKeys = {
  all: ['challenges'] as const,
  lists: () => [...challengeKeys.all, 'list'] as const,
  list: () => [...challengeKeys.lists()] as const,
  byTrip: (tripId: string) => [...challengeKeys.lists(), 'trip', tripId] as const,
}

export const challengeResultKeys = {
  all: ['challengeResults'] as const,
  lists: () => [...challengeResultKeys.all, 'list'] as const,
  list: () => [...challengeResultKeys.lists()] as const,
  byTrip: (tripId: string) => [...challengeResultKeys.lists(), 'trip', tripId] as const,
}

export function useChallenges() {
  return useQuery({
    queryKey: challengeKeys.list(),
    queryFn: () => getChallenges(),
  })
}

export function useChallengesByTripId(tripId: string) {
  return useQuery({
    queryKey: challengeKeys.byTrip(tripId),
    queryFn: () => getChallengesByTripId({ data: tripId }),
    enabled: !!tripId,
  })
}

export function useChallengeResults() {
  return useQuery({
    queryKey: challengeResultKeys.list(),
    queryFn: () => getChallengeResults(),
  })
}

export function useChallengeResultsByTripId(tripId: string) {
  return useQuery({
    queryKey: challengeResultKeys.byTrip(tripId),
    queryFn: () => getChallengeResultsByTripId({ data: tripId }),
    enabled: !!tripId,
  })
}

export function useCreateChallenge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challenge: Challenge) => insertChallenge({ data: challenge }),
    onSuccess: (_, challenge) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: challengeKeys.byTrip(challenge.tripId) })
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(challenge.tripId) })
    },
  })
}

export function useUpdateChallenge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<Challenge, 'id' | 'tripId'>>; tripId?: string }) =>
      updateChallenge({ data: { id, changes } }),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() })
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: challengeKeys.byTrip(tripId) })
      }
    },
  })
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tripId?: string }) => deleteChallenge({ data: { id } }),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: challengeKeys.lists() })
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: challengeKeys.byTrip(tripId) })
        queryClient.invalidateQueries({ queryKey: challengeResultKeys.byTrip(tripId) })
      }
    },
  })
}

export function useCreateChallengeResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ result }: { result: ChallengeResult; tripId?: string }) => insertChallengeResult({ data: result }),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: challengeResultKeys.lists() })
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: challengeResultKeys.byTrip(tripId) })
      }
    },
  })
}

export function useUpdateChallengeResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<ChallengeResult, 'id' | 'challengeId' | 'golferId'>>; tripId?: string }) =>
      updateChallengeResult({ data: { id, changes } }),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: challengeResultKeys.lists() })
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: challengeResultKeys.byTrip(tripId) })
      }
    },
  })
}

export function useDeleteChallengeResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; tripId?: string }) => deleteChallengeResult({ data: { id } }),
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: challengeResultKeys.lists() })
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: challengeResultKeys.byTrip(tripId) })
      }
    },
  })
}
