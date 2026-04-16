import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  allocateAdjacent,
  fetchAdjacentAllocations,
  patchAdjacentAllocation,
} from '@/features/adjacent-allocations/api'
import { rowsFromListPayload } from '@/features/adjacent-allocations/normalize'
import type {
  AdjacentListParams,
  AdjacentListSelectResult,
  AllocateAdjacentPayload,
  PatchAdjacentAllocationPayload,
} from '@/features/adjacent-allocations/types'

export const ADJACENT_ALLOCATIONS_QUERY_KEY = [
  'adjacent-allocations',
] as const

export function adjacentAllocationsQueryKey(params: AdjacentListParams) {
  return [
    ...ADJACENT_ALLOCATIONS_QUERY_KEY,
    params.program,
    params.year,
    params.page ?? 1,
    params.limit ?? 20,
  ] as const
}

export function useAdjacentAllocations(params: AdjacentListParams) {
  const limit = params.limit ?? 20
  return useQuery({
    queryKey: adjacentAllocationsQueryKey(params),
    queryFn: () => fetchAdjacentAllocations(params),
    select: (data): AdjacentListSelectResult =>
      rowsFromListPayload(data, limit),
  })
}

export function useAllocateAdjacent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AllocateAdjacentPayload) =>
      allocateAdjacent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADJACENT_ALLOCATIONS_QUERY_KEY })
    },
  })
}

export function usePatchAdjacentAllocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PatchAdjacentAllocationPayload) =>
      patchAdjacentAllocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADJACENT_ALLOCATIONS_QUERY_KEY })
    },
  })
}
