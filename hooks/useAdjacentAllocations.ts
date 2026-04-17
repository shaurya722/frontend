import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  allocateAdjacent,
  fetchAdjacentAllocations,
  fetchAdjacentAllocationById,
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

export function useAdjacentAllocations(params: AdjacentListParams, enabled = true) {
  const limit = params.limit ?? 20
  return useQuery({
    queryKey: adjacentAllocationsQueryKey(params),
    queryFn: () => fetchAdjacentAllocations(params),
    select: (data): AdjacentListSelectResult =>
      rowsFromListPayload(data, limit),
    enabled,
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

export const ADJACENT_ALLOCATION_BY_ID_QUERY_KEY = [
  'adjacent-allocation-by-id',
] as const

export function adjacentAllocationByIdQueryKey(reallocationId: string) {
  return [...ADJACENT_ALLOCATION_BY_ID_QUERY_KEY, reallocationId] as const
}

export function useAdjacentAllocation(reallocationId: string | null) {
  return useQuery({
    queryKey: adjacentAllocationByIdQueryKey(reallocationId ?? ''),
    queryFn: () => fetchAdjacentAllocationById(reallocationId!),
    enabled: !!reallocationId && reallocationId.length > 0,
  })
}
