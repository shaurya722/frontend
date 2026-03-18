// Regulatory Rules feature types

export interface RegulatoryRule {
  id: number
  regulatory_rule: string
  census_year: number
  name: string
  description: string
  year: number
  program: string
  category: string
  rule_type: string
  min_population?: number
  max_population?: number
  site_per_population?: number
  base_required_sites?: number
  reallocation_percentage?: number
  event_offset_percentage?: number
  is_active: boolean
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface RegulatoryRulesQueryParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  program?: string
  category?: string
  rule_type?: string
  is_active?: boolean | string
  year?: number
}

export interface CreateRegulatoryRuleDto {
  name: string
  regulatory_rule: string
  census_year: number
  program: string
  category: string
  rule_type: string
  description: string
  min_population?: number
  max_population?: number
  site_per_population?: number
  base_required_sites?: number
  reallocation_percentage?: number
  event_offset_percentage?: number
  is_active: boolean
  start_date: string | null
  end_date?: string | null
}

export interface UpdateRegulatoryRuleDto {
  name?: string
  regulatory_rule?: string
  census_year?: number
  program?: string
  category?: string
  rule_type?: string
  min_population?: number
  max_population?: number
  site_per_population?: number
  base_required_sites?: number
  reallocation_percentage?: number
  event_offset_percentage?: number
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
}

export interface RegulatoryRulesResponse {
  count: number
  next: string | null
  previous: string | null
  results: RegulatoryRule[]
}
