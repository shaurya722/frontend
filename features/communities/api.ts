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
  CreateCommunityCensusDto,
  CommunityDropdownResponse,
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
export async function fetchCommunityById(id: string): Promise<CommunityCensus> {
  const response = await axiosInstance.get<CommunityCensus>(`/api/community/communities/${id}/`)
  return response.data
}

/**
 * Create new community
 */
export async function createCommunity(data: CreateCommunityDto) {
  const response = await axiosInstance.post<ApiResponse<Community>>('/communities/', data)
  return response.data
}

/**
 * Create new community census data
 */
export async function createCommunityCensus(data: CreateCommunityCensusDto) {
  const response = await axiosInstance.post<CommunityCensus>('/api/community/community-census-data/', data)
  return response.data
}

/**
 * Update existing community
 */
export async function updateCommunity(id: string, data: UpdateCommunityDto) {
  const response = await axiosInstance.put<CommunityCensus>(`/api/community/communities/${id}/`, data)
  return response.data
}

/**
 * Delete community
 */
export async function deleteCommunity(id: string) {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/api/community/communities/${id}/`)
  return response.data
}

/**
 * Bulk import communities from CSV
 */
export async function bulkImportCommunities(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post('/api/community/community-census-data/import-export/', formData, {
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

/**
 * Download community census template CSV
 */
export async function downloadCommunityCensusTemplate() {
  const response = await axiosInstance.get<Blob>(
    '/api/community/community-census-data/template/',
    {
      responseType: 'blob',
    }
  )

  return response.data
}

/**
 * Fetch available census years
 */
export async function fetchCensusYears(): Promise<{ years: Array<{ id: number; year: number }>; total: number }> {
  const response = await axiosInstance.get<{ years: Array<{ id: number; year: number }>; total: number }>('/api/community/years/')
  return response.data
}

/**
 * Fetch communities for dropdown based on census year
 */
export async function fetchCommunityDropdown(year?: number): Promise<CommunityDropdownResponse> {
  const queryParams = new URLSearchParams()
  if (year) {
    queryParams.append('year', year.toString())
  }

  const response = await axiosInstance.get<CommunityDropdownResponse>(
    `/api/community/communities/dropdown/?${queryParams.toString()}`
  )

  return response.data
}
