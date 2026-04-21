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
