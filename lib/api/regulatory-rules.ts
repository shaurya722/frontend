// Regulatory Rules API functions

import axiosInstance from '@/lib/axios-instance'
import type { ApiResponse, PaginatedResponse } from '@/lib/api-client'

export interface RegulatoryRule {
  id: string
  name: string
  description: string
  program: string
  category: string
  rule_type: string
  min_population?: number | null
  max_population?: number | null
  site_per_population?: number | null
  base_required_sites?: number | null
  event_offset_percentage?: number | null
  reallocation_percentage?: number | null
  status: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface RegulatoryRulesFilters {
  program?: string
  is_active?: boolean
  category?: string
  rule_type?: string
}

export interface RegulatoryRulesQueryParams {
  page?: number
  limit?: number
  search?: string
  searchFields?: string[]
  filters?: RegulatoryRulesFilters
  sort?: 1 | -1
  sortBy?: string
}

export interface RegulatoryRulesRequestBody {
  filters?: RegulatoryRulesFilters
  search?: string
  searchFields?: string[]
  sort?: 1 | -1
  sortBy?: string
}

export interface RegulatoryRuleUpdateData {
  rule_type?: string
  event_offset_percentage?: number
  reallocation_percentage?: number
  name?: string
  is_active?: boolean
  min_population?: number
  max_population?: number
  site_per_population?: number
  base_required_sites?: number
}

/**
 * Fetch paginated regulatory rules with filters and search
 */
export async function getRegulatoryRules(params: RegulatoryRulesQueryParams = {}): Promise<PaginatedResponse<RegulatoryRule>> {
  const { page = 1, limit = 10, search, searchFields, filters, sort, sortBy } = params

  // Build query string for pagination
  const queryParams = new URLSearchParams()
  queryParams.append('page', page.toString())
  queryParams.append('limit', limit.toString())

  // Build request body for advanced filtering
  const body: RegulatoryRulesRequestBody = {}

  if (search) body.search = search
  if (searchFields && searchFields.length > 0) body.searchFields = searchFields
  if (filters && Object.keys(filters).length > 0) body.filters = filters
  if (sort !== undefined) body.sort = sort
  if (sortBy) body.sortBy = sortBy

  const response = await axiosInstance.post<ApiResponse<PaginatedResponse<RegulatoryRule>>>(
    `/regulatory-rules/?${queryParams.toString()}`,
    body
  )

  return response.data.data
}

/**
 * Fetch single regulatory rule by ID
 */
export async function getRegulatoryRuleById(id: string): Promise<RegulatoryRule> {
  const response = await axiosInstance.get<ApiResponse<RegulatoryRule>>(
    `/regulatory-rules/${id}/`
  )

  return response.data.data
}

/**
 * Update regulatory rule
 */
export async function updateRegulatoryRule(id: string, data: RegulatoryRuleUpdateData): Promise<RegulatoryRule> {
  const response = await axiosInstance.patch<ApiResponse<RegulatoryRule>>(
    `/regulatory-rules/${id}/update/`,
    data
  )

  return response.data.data
}

/**
 * Create new regulatory rule
 */
export async function createRegulatoryRule(data: Omit<RegulatoryRule, 'id' | 'created_at' | 'updated_at'>): Promise<RegulatoryRule> {
  const response = await axiosInstance.post<ApiResponse<RegulatoryRule>>(
    '/regulatory-rules/',
    data
  )

  return response.data.data
}

/**
 * Get regulatory rules that apply to a specific community
 */
export async function getRegulatoryRulesForCommunity(communityId: string): Promise<RegulatoryRule[]> {
  const response = await axiosInstance.get<ApiResponse<RegulatoryRule[]>>(
    `/regulatory-rules/community/${communityId}/`
  )

  return response.data.data
}

// Legacy compatibility functions (if needed)
export const regulatoryRules = {
  list: getRegulatoryRules,
  get: getRegulatoryRuleById,
  create: createRegulatoryRule,
  update: updateRegulatoryRule,
  getForCommunity: getRegulatoryRulesForCommunity,
  // delete: deleteRegulatoryRule,
}
