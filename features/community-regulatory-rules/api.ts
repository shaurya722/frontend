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
): Promise<ApiResponse<PaginatedResponse<CommunityRegulatoryRule>>> {
  const { page = 1, limit = 20, search, searchFields, filters, sort, sortBy } = params

  // Build query string
  const queryParams = new URLSearchParams()
  queryParams.append('page', page.toString())
  queryParams.append('limit', limit.toString())

  // Build request body
  const body: CommunityRegulatoryRulesRequestBody = {}

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

  const response = await axiosInstance.post<ApiResponse<PaginatedResponse<CommunityRegulatoryRule>>>(
    `/regulatory-rules/?${queryParams.toString()}`,
    body
  )

  return response.data
}

/**
 * Fetch single community regulatory rule by ID
 */
export async function fetchCommunityRegulatoryRuleById(id: string): Promise<CommunityRegulatoryRule> {
  const response = await axiosInstance.get<ApiResponse<CommunityRegulatoryRule>>(`/regulatory-rules/${id}/`)
  return response.data.data
}

/**
 * Create new community regulatory rule
 */
export async function createCommunityRegulatoryRule(data: Partial<CommunityRegulatoryRule>) {
  const response = await axiosInstance.post<ApiResponse<CommunityRegulatoryRule>>('/regulatory-rules/', data)
  return response.data
}

/**
 * Update existing community regulatory rule
 */
export async function updateCommunityRegulatoryRule(id: string, data: Partial<CommunityRegulatoryRule>) {
  const response = await axiosInstance.patch<ApiResponse<CommunityRegulatoryRule>>(`/regulatory-rules/${id}/update/`, data)
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

/**
 * Export community regulatory rules to CSV
 */
export async function exportCommunityRegulatoryRules(params: CommunityRegulatoryRulesQueryParams = {}) {
  const response = await axiosInstance.post('/regulatory-rules/export/', params, {
    responseType: 'blob',
  })

  return response.data
}
