// Regulatory Rules API functions

import axiosInstance from '@/lib/axios-instance'
import type {
  RegulatoryRulesQueryParams,
  RegulatoryRule,
  CreateRegulatoryRuleDto,
  UpdateRegulatoryRuleDto,
  RegulatoryRulesResponse,
} from './types'

/**
 * Fetch paginated regulatory rules with filters, search, and sorting
 */
export async function fetchRegulatoryRules(
  params: RegulatoryRulesQueryParams = {}
): Promise<RegulatoryRulesResponse> {
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

  if (is_active !== undefined) {
    queryParams.append('is_active', is_active.toString())
  }

  const response = await axiosInstance.get<RegulatoryRulesResponse>(
    `/api/regulatory-rules/rules/?${queryParams.toString()}`
  )

  return response.data
}

/**
 * Fetch single regulatory rule by ID
 */
export async function fetchRegulatoryRuleById(id: string): Promise<RegulatoryRule> {
  const response = await axiosInstance.get<RegulatoryRule>(`/api/regulatory-rules/rules/${id}/`)
  return response.data
}

/**
 * Create new regulatory rule
 */
export async function createRegulatoryRule(data: CreateRegulatoryRuleDto): Promise<RegulatoryRule> {
  const response = await axiosInstance.post<RegulatoryRule>('/api/regulatory-rules/rules/', data)
  return response.data
}

/**
 * Update existing regulatory rule
 */
export async function updateRegulatoryRule(id: string, data: UpdateRegulatoryRuleDto): Promise<RegulatoryRule> {
  const response = await axiosInstance.put<RegulatoryRule>(`/api/regulatory-rules/rules/${id}/`, data)
  return response.data
}

/**
 * Delete regulatory rule
 */
export async function deleteRegulatoryRule(id: string): Promise<void> {
  const response = await axiosInstance.delete(`/api/regulatory-rules/rules/${id}/`)
  return response.data
}
