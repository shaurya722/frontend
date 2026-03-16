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

export interface CommunityCensus {
  id: number
  community: string
  community_name: string
  census_year: number
  census_year_value: number
  population: number
  tier: string
  region: string
  zone: string
  province: string
  is_active: boolean
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface CommunitiesFilters {
  tier?: string
  province?: string
  census_year?: number
  status?: string
  region?: string
  min_population?: number
  max_population?: number
  is_active?: boolean
}

export interface CommunitiesQueryParams {
  page?: number
  limit?: number
  search?: string
  year?: number
  tier?: string
  status?: string
  region?: string
  min_population?: number
  max_population?: number
  is_active?: boolean | string
  sort?: string
}

export interface CommunitiesRequestBody {
  search?: string
  searchFields?: string[]
  filters?: CommunitiesFilters
  sort?: 1 | -1
  sortBy?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
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

export interface CreateCommunityCensusDto {
  community: string
  census_year: number
  population: number
  tier: string
  region: string
  zone: string
  province: string
  is_active: boolean
}

export interface UpdateCommunityDto {
  community?: string
  population?: number
  tier?: string
  region?: string
  zone?: string
  province?: string
  census_year?: number
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
}

export interface CommunityDropdownItem {
  id: string
  name: string
}

export interface CommunityDropdownResponse {
  communities: CommunityDropdownItem[]
  total: number
}
