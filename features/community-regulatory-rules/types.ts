// Types for Community Regulatory Rules

import type { RegulatoryRule } from '@/lib/api/regulatory-rules'

export interface CommunityRegulatoryRule extends RegulatoryRule {
  community_id: string
  community_name: string
  is_applicable: boolean
  calculated_sites?: number
  reason?: string
}

export interface CommunityRegulatoryRulesQueryParams {
  communityId?: string
  page?: number
  limit?: number
  search?: string
  searchFields?: string[]
  filters?: CommunityRegulatoryRulesFilters
  sort?: 1 | -1
  sortBy?: string
  program?: string
  category?: string
  rule_type?: string
}

export interface CommunityRegulatoryRulesFilters {
  program?: string
  is_active?: boolean
  category?: string
  rule_type?: string
  community_id?: string
}

export interface CommunityRegulatoryRulesRequestBody {
  filters?: CommunityRegulatoryRulesFilters
  search?: string
  searchFields?: string[]
  sort?: 1 | -1
  sortBy?: string
}

export interface CommunityRegulatoryRulesResponse {
  community: {
    id: string
    name: string
    region_id: string
    population: number
  }
  applicable_rules: CommunityRegulatoryRule[]
  total_rules: number
  applied_rules: number
}

export interface ApplyRegulatoryRulesParams {
  communityId: string
  regulatoryRuleIds?: string[]
  program?: string
  category?: string
}

export interface RegulatoryRulesCalculation {
  community_id: string
  rule_id: string
  calculated_sites: number
  formula_used: string
  parameters: Record<string, any>
  result: number
}
