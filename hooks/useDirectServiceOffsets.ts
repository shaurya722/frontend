import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchDirectServiceOffsets,
  createDirectServiceOffset,
  updateDirectServiceOffset,
  createCommunityOffset,
  updateCommunityOffset,
  fetchDirectServiceOffsetPreview,
} from '@/features/direct-service-offsets/api'
import type {
  CreateDirectServiceOffsetPayload,
  UpdateDirectServiceOffsetPayload,
  CreateCommunityOffsetPayload,
  UpdateCommunityOffsetPayload,
} from '@/features/direct-service-offsets/types'

export const DIRECT_SERVICE_OFFSETS_QUERY_KEY = ['direct-service-offsets'] as const

export function useDirectServiceOffsets() {
  return useQuery({
    queryKey: DIRECT_SERVICE_OFFSETS_QUERY_KEY,
    queryFn: fetchDirectServiceOffsets,
  })
}

export function useCreateDirectServiceOffset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDirectServiceOffsetPayload) =>
      createDirectServiceOffset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECT_SERVICE_OFFSETS_QUERY_KEY })
    },
  })
}

export function useUpdateDirectServiceOffset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDirectServiceOffsetPayload }) =>
      updateDirectServiceOffset(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECT_SERVICE_OFFSETS_QUERY_KEY })
    },
  })
}

export function useCreateCommunityOffset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCommunityOffsetPayload) =>
      createCommunityOffset(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECT_SERVICE_OFFSETS_QUERY_KEY })
    },
  })
}

export const DIRECT_SERVICE_OFFSET_PREVIEW_QUERY_KEY = ['direct-service-offset-preview'] as const

export function useDirectServiceOffsetPreview(
  censusYearId: number | null,
  program: string | null,
  page?: number,
  limit?: number,
  sort?: string,
) {
  return useQuery({
    queryKey: [...DIRECT_SERVICE_OFFSET_PREVIEW_QUERY_KEY, censusYearId, program, page, limit, sort],
    queryFn: () => {
      if (!censusYearId || !program) {
        throw new Error('censusYearId and program are required')
      }
      return fetchDirectServiceOffsetPreview(censusYearId, program, page, limit, sort)
    },
    enabled: !!censusYearId && !!program,
  })
}

export function useUpdateCommunityOffset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCommunityOffsetPayload }) =>
      updateCommunityOffset(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECT_SERVICE_OFFSET_PREVIEW_QUERY_KEY })
    },
  })
}
