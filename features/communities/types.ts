// Communities feature types

export interface Zone {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Region {
  id: string
  zone: string
  zone_detail: Zone
  name: string
  created_at: string
  updated_at: string
}

export interface Community {
  id: string | number
  region_detail: Region
  name: string
  population?: number
  tier?: string
  province?: string
  census_year?: number
  created_at: string
  updated_at: string
}

export interface CommunitiesFilters {
  tier?: string
  province?: string
  census_year?: number
}

export interface CommunitiesQueryParams {
  page?: number
  limit?: number
  search?: string
  searchFields?: string[]
  filters?: CommunitiesFilters
  sort?: 1 | -1
  sortBy?: string
}

export interface CommunitiesRequestBody {
  search?: string
  searchFields?: string[]
  filters?: CommunitiesFilters
  sort?: 1 | -1
  sortBy?: string
}

export interface PaginatedResponse<T> {
  docs: T[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  nextPage: number | null
  page: number
  prevPage: number | null
  totalDocs: number
  totalPages: number
}

export interface ApiResponse<T> {
  status: number
  message: string
  results: number
  data: T
}

export interface CreateCommunityDto {
  name: string
  population?: number
  tier?: string
  province?: string
  census_year?: number
}

export interface UpdateCommunityDto {
  name?: string
  population?: number
  tier?: string
  province?: string
  census_year?: number
}
