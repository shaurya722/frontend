// Community Regulatory Rules API functions

import axiosInstance from '@/lib/axios-instance'
import type { ApiResponse, PaginatedResponse } from '@/lib/api-client'
import type { RegulatoryRule } from '@/lib/api/regulatory-rules'
import type {
  CommunityRegulatoryRulesQueryParams,
  CommunityRegulatoryRulesRequestBody,
  CommunityRegulatoryRule,
  ApplyRegulatoryRulesParams,
  RegulatoryRulesCalculation,
} from './types'

/**
 * Fetch paginated community regulatory rules with filters, search, and sorting
 */
export async function fetchCommunityRegulatoryRules(
  params: CommunityRegulatoryRulesQueryParams = {}
): Promise<{ results: CommunityRegulatoryRule[] }> {
  const { page = 1, limit = 10, search, sort, program, category, rule_type, is_active, year } = params

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

  if (sort) {
    queryParams.append('sort', sort)
  }

  if (program) {
    queryParams.append('program', program)
  }

  if (category) {
    queryParams.append('category', category)
  }

  if (rule_type) {
    queryParams.append('rule_type', rule_type)
  }

  if (is_active) {
    queryParams.append('is_active', is_active.toString())
  }

  const response = await axiosInstance.get<{ results: CommunityRegulatoryRule[] }>(
    `/api/regulatory-rules/rules/?${queryParams.toString()}`
  )

  return response.data
}

/**
 * Fetch single community regulatory rule by ID
 */
export async function fetchCommunityRegulatoryRuleById(id: string): Promise<CommunityRegulatoryRule> {
  const response = await axiosInstance.get<CommunityRegulatoryRule>(`/api/regulatory-rules/rules/${id}/`)
  return response.data
}

export async function updateCommunityRegulatoryRule(id: string, data: Partial<CommunityRegulatoryRule>) {
  const response = await axiosInstance.patch<ApiResponse<CommunityRegulatoryRule>>(`/regulatory-rules/${id}/update/`, data)
  return response.data
}

/**
 * Create new community regulatory rule
 */
export async function createCommunityRegulatoryRule(data: Partial<CommunityRegulatoryRule>) {
  const response = await axiosInstance.post<ApiResponse<CommunityRegulatoryRule>>('/api/regulatory-rules/rules/', data)
  return response.data
}

/**
 * Delete community regulatory rule
 */
export async function deleteCommunityRegulatoryRule(id: string) {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/regulatory-rules/${id}/`)
  return response.data
}

/**
 * Apply regulatory rules to a community
 */
export async function applyRegulatoryRulesToCommunity(params: ApplyRegulatoryRulesParams): Promise<RegulatoryRulesCalculation[]> {
  const response = await axiosInstance.post<ApiResponse<RegulatoryRulesCalculation[]>>(
    `/communities/${params.communityId}/apply-regulatory-rules/`,
    {
      regulatory_rule_ids: params.regulatoryRuleIds,
      program: params.program,
      category: params.category,
    }
  )

  return response.data.data
}

/**
 * Bulk import community regulatory rules from CSV
 */
export async function bulkImportCommunityRegulatoryRules(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post<ApiResponse<any>>('/regulatory-rules/bulk-import/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function deleteRegulatoryRule(ruleId: string): Promise<void> {
  const response = await axiosInstance.delete(`/api/regulatory-rules/rules/${ruleId}/`)
  return response.data
}
