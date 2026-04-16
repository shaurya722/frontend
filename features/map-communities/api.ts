import axiosInstance from '@/lib/axios-instance'
import type {
  AvailableMapCommunitiesResponse,
  CreateMapCommunityPayload,
  MapCommunity,
  UpdateMapCommunityPayload,
} from './types'

/** List/create: trailing slash. Detail: `/api/community/map-communities/{uuid}/` (DRF-style). */
const BASE = '/api/community/map-communities/'

function detailUrl(id: string) {
  return `${BASE}${encodeURIComponent(id)}/`
}

export async function fetchAvailableMapCommunities(params: {
  search?: string
  limit?: number
}): Promise<AvailableMapCommunitiesResponse> {
  const { data } = await axiosInstance.get<AvailableMapCommunitiesResponse>(
    `${BASE}available/`,
    {
      params: {
        search: params.search?.trim() || undefined,
        limit: params.limit ?? 100,
      },
    },
  )
  return data
}

export async function fetchMapCommunities(): Promise<MapCommunity[]> {
  const { data } = await axiosInstance.get<MapCommunity[]>(BASE)
  return Array.isArray(data) ? data : []
}

export async function fetchMapCommunity(id: string): Promise<MapCommunity> {
  const { data } = await axiosInstance.get<MapCommunity>(detailUrl(id))
  return data
}

export async function createMapCommunity(
  payload: CreateMapCommunityPayload,
): Promise<MapCommunity> {
  const { data } = await axiosInstance.post<MapCommunity>(BASE, payload)
  return data
}

export async function updateMapCommunity(
  id: string,
  payload: UpdateMapCommunityPayload,
): Promise<MapCommunity> {
  // Use `.put` instead if your API only implements full replace on update.
  const { data } = await axiosInstance.patch<MapCommunity>(
    detailUrl(id),
    payload,
  )
  return data
}

export async function deleteMapCommunity(id: string): Promise<void> {
  await axiosInstance.delete(detailUrl(id))
}
