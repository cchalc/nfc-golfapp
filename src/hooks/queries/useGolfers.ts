import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getGolfers, getGolfer } from '../../server/queries'
import { insertGolfer, updateGolfer, deleteGolfer } from '../../server/mutations'
import type { Golfer } from '../../db/collections'

export const golferKeys = {
  all: ['golfers'] as const,
  lists: () => [...golferKeys.all, 'list'] as const,
  list: () => [...golferKeys.lists()] as const,
  details: () => [...golferKeys.all, 'detail'] as const,
  detail: (id: string) => [...golferKeys.details(), id] as const,
}

export function useGolfers() {
  return useQuery({
    queryKey: golferKeys.list(),
    queryFn: () => getGolfers(),
  })
}

export function useGolfer(id: string) {
  return useQuery({
    queryKey: golferKeys.detail(id),
    queryFn: () => getGolfer({ data: id }),
    enabled: !!id,
  })
}

export function useCreateGolfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (golfer: Omit<Golfer, 'createdAt'> & { createdAt?: Date }) => insertGolfer({ data: golfer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: golferKeys.lists() })
    },
  })
}

export function useUpdateGolfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<Omit<Golfer, 'id' | 'createdAt'>> }) =>
      updateGolfer({ data: { id, changes } }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: golferKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: golferKeys.lists() })
    },
  })
}

export function useDeleteGolfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGolfer({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: golferKeys.lists() })
    },
  })
}
