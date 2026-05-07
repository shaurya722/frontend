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
  const queryParams = new URLSearchParams()

  if (params.search) queryParams.append('search', params.search)
  if (params.year) queryParams.append('year', params.year.toString())
  if (params.tier) queryParams.append('tier', params.tier)
  if (params.region) queryParams.append('region', params.region)
  if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())

  const response = await axiosInstance.get(`/api/community/community-census-data/import-export/?${queryParams.toString()}`, {
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

/** DRF `next` only when the payload includes that field */
function drfNextFrom(r: Record<string, unknown>): string | null | undefined {
  if (!('next' in r)) return undefined
  const n = r.next
  if (n === null) return null
  if (typeof n === 'string') return n
  return undefined
}

/**
 * Normalize model-dropdown / dropdown API payloads into CommunityDropdownResponse.
 */
function normalizeCommunityDropdownResponse(raw: unknown): CommunityDropdownResponse {
  if (!raw || typeof raw !== 'object') {
    return { communities: [], total: 0 }
  }
  const r = raw as Record<string, unknown>
  const nextLink = drfNextFrom(r)
  const withNext = (base: CommunityDropdownResponse): CommunityDropdownResponse =>
    nextLink !== undefined ? { ...base, next: nextLink } : base

  if (Array.isArray(r.communities)) {
    const communities = (r.communities as { id?: string | number; name?: string }[]).map((c) => ({
      id: String(c.id ?? c.name ?? ''),
      name: String(c.name ?? ''),
    }))
    const total = typeof r.total === 'number' ? r.total : communities.length
    return withNext({ communities, total })
  }

  if (Array.isArray(r.results)) {
    const rows = r.results as Record<string, unknown>[]
    const communities = rows.map((row) => ({
      id: String(row.id ?? row.pk ?? row.name ?? row.community_name ?? ''),
      name: String(
        row.name ?? row.community_name ?? row.community ?? row.label ?? '',
      ),
    }))
    const total = typeof r.count === 'number' ? r.count : communities.length
    return withNext({ communities, total })
  }

  if (Array.isArray(raw)) {
    const rows = raw as Record<string, unknown>[]
    return {
      communities: rows.map((row) => ({
        id: String(row.id ?? row.name ?? ''),
        name: String(row.name ?? row.community_name ?? ''),
      })),
      total: rows.length,
    }
  }

  return { communities: [], total: 0 }
}

/**
 * Fetch communities for dropdown (model-dropdown list).
 * GET /api/community/communities/model-dropdown/?page=1&limit=200&search=…&year=…
 */
export async function fetchCommunityDropdown(
  year?: number,
  search?: string,
  page?: number,
  limit?: number,
): Promise<CommunityDropdownResponse> {
  const queryParams = new URLSearchParams()
  if (year !== undefined && year !== null && !Number.isNaN(year)) {
    queryParams.append('year', String(year))
  }
  if (search) queryParams.append('search', search)
  queryParams.append('page', String(page ?? 1))
  queryParams.append('limit', String(limit ?? 200))

  const response = await axiosInstance.get<unknown>(
    `/api/community/communities/model-dropdown/?${queryParams.toString()}`,
  )

  return normalizeCommunityDropdownResponse(response.data)
}
