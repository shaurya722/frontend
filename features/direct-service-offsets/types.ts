export interface DirectServiceOffset {
  id: number
  census_year: number
  program: string
  percentage: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateDirectServiceOffsetPayload {
  census_year: number
  program: string
  percentage: number
  is_active: boolean
}

export interface UpdateDirectServiceOffsetPayload {
  percentage?: number
  is_active?: boolean
}

export interface CommunityOffset {
  id: number
  census_year: number
  program: string
  community: string
  percentage: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateCommunityOffsetPayload {
  census_year: number
  program: string
  community: string
  percentage: number
  is_active: boolean
}

export interface UpdateCommunityOffsetPayload {
  percentage?: number
  is_active?: boolean
}

export interface PreviewCommunity {
  community_id: string
  community_name: string
  population: number
  base_required_sites: number
  offset_percentage: number
  offset_source: 'global' | 'community'
  new_required_sites: number
  has_community_override: boolean
}

export interface CensusYearInfo {
  id: number
  year: number
}

export interface DirectServiceOffsetPreview {
  census_year: CensusYearInfo
  program: string
  communities: PreviewCommunity[]
  total_communities: number
  page?: number
  limit?: number
  total_pages?: number
}
