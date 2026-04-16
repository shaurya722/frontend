import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMapCommunity,
  deleteMapCommunity,
  fetchAvailableMapCommunities,
  fetchMapCommunities,
  fetchMapCommunity,
  updateMapCommunity,
} from '@/features/map-communities/api'
import type {
  CreateMapCommunityPayload,
  UpdateMapCommunityPayload,
} from '@/features/map-communities/types'

export const MAP_COMMUNITIES_QUERY_KEY = ['map-communities'] as const

export const MAP_COMMUNITIES_AVAILABLE_QUERY_KEY = [
  'map-communities',
  'available',
] as const

export function mapCommunityQueryKey(id: string) {
  return [...MAP_COMMUNITIES_QUERY_KEY, id] as const
}

export function useMapCommunities() {
  return useQuery({
    queryKey: MAP_COMMUNITIES_QUERY_KEY,
    queryFn: fetchMapCommunities,
  })
}

export function useMapCommunity(id: string | null, enabled = true) {
  return useQuery({
    queryKey: id
      ? mapCommunityQueryKey(id)
      : ([...MAP_COMMUNITIES_QUERY_KEY, 'detail', '_'] as const),
    queryFn: () => fetchMapCommunity(id!),
    enabled: Boolean(id) && enabled,
  })
}

export function useAvailableMapCommunities(
  search: string,
  limit = 100,
  enabled = true,
) {
  return useQuery({
    queryKey: [...MAP_COMMUNITIES_AVAILABLE_QUERY_KEY, search, limit] as const,
    queryFn: () => fetchAvailableMapCommunities({ search, limit }),
    enabled,
  })
}

export function useCreateMapCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMapCommunityPayload) =>
      createMapCommunity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAP_COMMUNITIES_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: MAP_COMMUNITIES_AVAILABLE_QUERY_KEY,
      })
    },
  })
}

export function useUpdateMapCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateMapCommunityPayload
    }) => updateMapCommunity(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MAP_COMMUNITIES_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: mapCommunityQueryKey(variables.id),
      })
      queryClient.invalidateQueries({
        queryKey: MAP_COMMUNITIES_AVAILABLE_QUERY_KEY,
      })
    },
  })
}

export function useDeleteMapCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMapCommunity(id),
    onSuccess: (_void, id) => {
      queryClient.invalidateQueries({ queryKey: MAP_COMMUNITIES_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: MAP_COMMUNITIES_AVAILABLE_QUERY_KEY,
      })
      queryClient.removeQueries({ queryKey: mapCommunityQueryKey(id) })
    },
  })
}
