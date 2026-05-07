import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBaseCommunities,
  getBaseCommunity,
  createBaseCommunity,
  updateBaseCommunity,
  deleteBaseCommunity,
  type BaseCommunitiesListParams,
  type CreateBaseCommunityPayload,
  type UpdateBaseCommunityPayload,
} from './api'

export const useBaseCommunities = (params?: BaseCommunitiesListParams) => {
  return useQuery({
    queryKey: ['base-communities', params],
    queryFn: () => getBaseCommunities(params),
  })
}

const PICKER_PAGE_SIZE = 50

/**
 * Paginated base-communities list for pickers (e.g. dialog). Load more via `fetchNextPage()`.
 */
export function useInfiniteBaseCommunitiesPicker(
  search: string | undefined,
  enabled: boolean,
  pageSize: number = PICKER_PAGE_SIZE,
) {
  const size = pageSize > 0 ? pageSize : PICKER_PAGE_SIZE
  return useInfiniteQuery({
    queryKey: ['base-communities-picker', search ?? '', size],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getBaseCommunities({
        search: search?.trim() || undefined,
        page: pageParam as number,
        page_size: size,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.next) return undefined
      return allPages.length + 1
    },
    enabled,
  })
}

export const useBaseCommunity = (id?: string) => {
  return useQuery({
    queryKey: ['base-community', id],
    queryFn: () => getBaseCommunity(id!),
    enabled: !!id,
  })
}

export const useCreateBaseCommunity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBaseCommunityPayload) => createBaseCommunity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-communities'] })
    },
  })
}

export const useUpdateBaseCommunity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBaseCommunityPayload }) =>
      updateBaseCommunity(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-communities'] })
      queryClient.invalidateQueries({ queryKey: ['base-community'] })
    },
  })
}

export const useDeleteBaseCommunity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBaseCommunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-communities'] })
    },
  })
}
