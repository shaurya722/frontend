import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchDirectServiceOffsets,
  createDirectServiceOffset,
  updateDirectServiceOffset,
  createCommunityOffset,
} from '@/features/direct-service-offsets/api'
import type {
  CreateDirectServiceOffsetPayload,
  UpdateDirectServiceOffsetPayload,
  CreateCommunityOffsetPayload,
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
