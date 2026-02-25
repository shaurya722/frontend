// Communities React Query hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCommunities,
  fetchCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  bulkImportCommunities,
  exportCommunities,
} from './api'
import type { CommunitiesQueryParams, CreateCommunityDto, UpdateCommunityDto } from './types'

export const COMMUNITIES_QUERY_KEY = 'communities'

/**
 * Hook to fetch paginated communities with filters
 */
export function useCommunities(params: CommunitiesQueryParams = {}) {
  return useQuery({
    queryKey: [COMMUNITIES_QUERY_KEY, params],
    queryFn: () => fetchCommunities(params),
    // staleTime: 30000, // 30 seconds
    // retry: 2,
  })
}

/**
 * Hook to fetch single community by ID
 */
export function useCommunity(id: string, enabled = true) {
  return useQuery({
    queryKey: [COMMUNITIES_QUERY_KEY, id],
    queryFn: () => fetchCommunityById(id),
    enabled: enabled && !!id,
    // staleTime: 30000,
  })
}

/**
 * Hook to create new community
 */
export function useCreateCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommunityDto) => createCommunity(data),
    onSuccess: () => {
      // Invalidate and refetch communities list
      queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to update existing community
 */
export function useUpdateCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommunityDto }) =>
      updateCommunity(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific community and list
      queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to delete community
 */
export function useDeleteCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCommunity(id),
    onSuccess: () => {
      // Invalidate communities list
      queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to bulk import communities
 */
export function useBulkImportCommunities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => bulkImportCommunities(file),
    onSuccess: () => {
      // Invalidate communities list
      queryClient.invalidateQueries({ queryKey: [COMMUNITIES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to export communities
 */
export function useExportCommunities() {
  return useMutation({
    mutationFn: (params: CommunitiesQueryParams) => exportCommunities(params),
  })
}
