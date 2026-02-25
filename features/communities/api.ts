// Communities API functions

import axiosInstance from '@/lib/axios-instance'
import type {
  Community,
  CommunitiesQueryParams,
  CommunitiesRequestBody,
  PaginatedResponse,
  ApiResponse,
  CreateCommunityDto,
  UpdateCommunityDto,
} from './types'

/**
 * Fetch paginated communities with filters, search, and sorting
 */
export async function fetchCommunities(params: CommunitiesQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Community>>> {
  const { page = 1, limit = 20, search, searchFields, filters, sort, sortBy } = params

  // Build query string
  const queryParams = new URLSearchParams()
  queryParams.append('page', page.toString())
  queryParams.append('limit', limit.toString())

  // Build request body
  const body: CommunitiesRequestBody = {}

  if (search) {
    body.search = search
  }

  if (searchFields && searchFields.length > 0) {
    body.searchFields = searchFields
  }

  if (filters && Object.keys(filters).length > 0) {
    body.filters = filters
  }

  if (sort !== undefined) {
    body.sort = sort
  }

  if (sortBy) {
    body.sortBy = sortBy
  }

  const response = await axiosInstance.post<ApiResponse<PaginatedResponse<Community>>>(
    `/communities/?${queryParams.toString()}`,
    body
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
