// Communities React Query hooks

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCommunities,
  fetchCommunityById,
  createCommunity,
  createCommunityCensus,
  updateCommunity,
  deleteCommunity,
  bulkImportCommunities,
  exportCommunities,
  fetchCensusYears,
  fetchCommunityDropdown,
} from './api'
import type { CommunitiesQueryParams, CreateCommunityDto, UpdateCommunityDto, CreateCommunityCensusDto, CommunityDropdownResponse } from './types'

export const COMMUNITIES_QUERY_KEY = 'communities'

/**
 * Hook to fetch paginated communities with filters
 */
export function useCommunities(params: CommunitiesQueryParams = {}, enabled = true) {
  return useQuery({
    queryKey: [COMMUNITIES_QUERY_KEY, params],
    queryFn: () => fetchCommunities(params),
    enabled,
  })
}

/**
 * Hook to fetch single community by ID
 */
export function useCommunity(id: string | number, enabled = true) {
  return useQuery({
    queryKey: [COMMUNITIES_QUERY_KEY, id],
    queryFn: () => fetchCommunityById(id.toString()),
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
 * Hook to create new community census data
 */
export function useCreateCommunityCensus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommunityCensusDto) => createCommunityCensus(data),
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

/**
 * Hook to fetch available census years
 */
export function useCensusYears() {
  return useQuery({
    queryKey: ['census-years'],
    queryFn: () => fetchCensusYears(),
    staleTime: 300000, // 5 minutes - census years don't change often
  })
}

/**
 * Hook to fetch communities for dropdown
 */
export function useCommunityDropdown(
  year?: number,
  search?: string,
  page?: number,
  limit?: number,
  enabledOverride?: boolean,
) {
  return useQuery({
    queryKey: [
      'community-dropdown',
      { year, search: search || '', page: page ?? 1, limit: limit ?? 200 },
    ],
    queryFn: () => fetchCommunityDropdown(year, search, page ?? 1, limit ?? 200),
    enabled: enabledOverride ?? !!year,
    staleTime: 60000, // 1 minute
  })
}

const DEFAULT_INFINITE_PAGE_SIZE = 50

/**
 * Infinite model-dropdown list: loads page 1, then fetches more when the parent
 * calls `fetchNextPage()` (e.g. from scroll near end of the options list).
 */
export function useInfiniteCommunityDropdown(
  year?: number,
  search?: string,
  pageSize: number = DEFAULT_INFINITE_PAGE_SIZE,
  enabledOverride?: boolean,
) {
  const limit = pageSize > 0 ? pageSize : DEFAULT_INFINITE_PAGE_SIZE
  return useInfiniteQuery({
    queryKey: ['community-dropdown-infinite', { year, search: search || '', limit }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchCommunityDropdown(year, search, pageParam as number, limit),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.communities.length, 0)
      if (lastPage.communities.length === 0) return undefined
      if (lastPage.next === null) return undefined
      if (typeof lastPage.next === 'string' && lastPage.next.length > 0) {
        return allPages.length + 1
      }
      if (lastPage.total > 0 && loaded >= lastPage.total) return undefined
      if (lastPage.communities.length < limit) return undefined
      return allPages.length + 1
    },
    enabled: enabledOverride ?? !!year,
    staleTime: 60_000,
  })
}
