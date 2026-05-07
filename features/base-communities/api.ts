import axiosInstance from '@/lib/axios-instance'

export interface BaseCommunity {
  id: string
  name: string
  boundary?: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: any
  }
  adjacent_ids?: string[]
  adjacent?: { id: string; name: string }[]
  created_at?: string
  updated_at?: string
}

export interface BaseCommunitiesListParams {
  search?: string
  page?: number
  page_size?: number
  /** Pagination size alias accepted by some callers. */
  limit?: number
  /**
   * Backend supports `sort`, `sortBy`, `sort_by`, `sortby`, and `ordering`.
   * Use signed string (e.g. `-name`, `-created_at`) for descending order.
   */
  sort?: string
  sortBy?: string
  ordering?: string
}

export interface BaseCommunitiesListResponse {
  count: number
  next: string | null
  previous: string | null
  results: BaseCommunity[]
}

export interface CreateBaseCommunityPayload {
  name: string
  boundary?: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: any
  }
  adjacent_ids?: string[]
}

export interface UpdateBaseCommunityPayload {
  name?: string
  boundary?: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: any
  }
  adjacent_ids?: string[]
}

export const getBaseCommunities = async (params?: BaseCommunitiesListParams): Promise<BaseCommunitiesListResponse> => {
  const response = await axiosInstance.get<BaseCommunitiesListResponse>('/api/community/base-communities/', { params })
  return response.data
}

export const getBaseCommunity = async (id: string): Promise<BaseCommunity> => {
  const response = await axiosInstance.get<BaseCommunity>(`/api/community/base-communities/${id}/`)
  return response.data
}

export const createBaseCommunity = async (payload: CreateBaseCommunityPayload): Promise<BaseCommunity> => {
  const response = await axiosInstance.post<BaseCommunity>('/api/community/base-communities/', payload)
  return response.data
}

export const updateBaseCommunity = async (id: string, payload: UpdateBaseCommunityPayload): Promise<BaseCommunity> => {
  const response = await axiosInstance.put<BaseCommunity>(`/api/community/base-communities/${id}/`, payload)
  return response.data
}

export const deleteBaseCommunity = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/community/base-communities/${id}/`)
}
