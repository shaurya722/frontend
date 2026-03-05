// Communities API functions

import axiosInstance from '@/lib/axios-instance'
import type {
  Community,
  CommunityCensus,
  CommunitiesQueryParams,
  PaginatedResponse,
  ApiResponse,
  CreateCommunityDto,
  UpdateCommunityDto,
} from './types'

/**
 * Fetch paginated communities with filters, search, and sorting
 */
export async function fetchCommunities(params: CommunitiesQueryParams = {}): Promise<PaginatedResponse<CommunityCensus>> {
  const {
    page = 1,
    limit = 20,
    search,
    year,
    tier,
    status,
    region,
    min_population,
    max_population,
    is_active,
    sort
  } = params

  // Build query string
  const queryParams = new URLSearchParams()
  queryParams.append('page', page.toString())
  queryParams.append('limit', limit.toString())

  if (search) {
    queryParams.append('search', search)
  }

  if (year) {
    queryParams.append('year', year.toString())
  }

  if (tier) {
    queryParams.append('tier', tier)
  }

  if (status) {
    queryParams.append('status', status)
  }

  if (region) {
    queryParams.append('region', region)
  }

  if (min_population !== undefined) {
    queryParams.append('min_population', min_population.toString())
  }

  if (max_population !== undefined) {
    queryParams.append('max_population', max_population.toString())
  }

  if (is_active !== undefined) {
    queryParams.append('is_active', is_active.toString())
  }

  if (sort) {
    queryParams.append('sort', sort)
  }

  const response = await axiosInstance.get<PaginatedResponse<CommunityCensus>>(
    `/api/community/community-census-data/?${queryParams.toString()}`
  )

  return response.data
}

/**
 * Fetch single community by ID
 */
export async function fetchCommunityById(id: string): Promise<Community> {
  const response = await axiosInstance.get<ApiResponse<Community>>(`/communities/${id}/`)
  return response.data.data
}

/**
 * Create new community
 */
export async function createCommunity(data: CreateCommunityDto) {
  const response = await axiosInstance.post<ApiResponse<Community>>('/communities/', data)
  return response.data
}

/**
 * Update existing community
 */
export async function updateCommunity(id: string, data: UpdateCommunityDto) {
  const response = await axiosInstance.put<ApiResponse<Community>>(`/communities/${id}/`, data)
  return response.data
}

/**
 * Delete community
 */
export async function deleteCommunity(id: string) {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/communities/${id}/`)
  return response.data
}

/**
 * Bulk import communities from CSV
 */
export async function bulkImportCommunities(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post<ApiResponse<any>>('/communities/bulk-import/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

/**
 * Export communities to CSV
 */
export async function exportCommunities(params: CommunitiesQueryParams = {}) {
  const response = await axiosInstance.post('/communities/export/', params, {
    responseType: 'blob',
  })

  return response.data
}
