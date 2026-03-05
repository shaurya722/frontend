// Community Regulatory Rules React Query hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCommunityRegulatoryRules,
  fetchCommunityRegulatoryRuleById,
  createCommunityRegulatoryRule,
  updateCommunityRegulatoryRule,
  deleteCommunityRegulatoryRule,
  applyRegulatoryRulesToCommunity,
  bulkImportCommunityRegulatoryRules,
  deleteRegulatoryRule,
} from './api'
import type {
  CommunityRegulatoryRulesQueryParams,
  CommunityRegulatoryRule,
  ApplyRegulatoryRulesParams
} from './types'

export const COMMUNITY_REGULATORY_RULES_QUERY_KEY = 'community-regulatory-rules'

/**
 * Hook to fetch all regulatory rules with filters and pagination
 */
export function useRegulatoryRules(params: CommunityRegulatoryRulesQueryParams = {}) {
  return useQuery({
    queryKey: [COMMUNITY_REGULATORY_RULES_QUERY_KEY, params],
    queryFn: () => fetchCommunityRegulatoryRules(params),
    staleTime: 0, // Disable caching for debugging
  })
}

/**
 * Hook to fetch single community regulatory rule by ID
 */
export function useCommunityRegulatoryRule(id: string, enabled = true) {
  return useQuery({
    queryKey: [COMMUNITY_REGULATORY_RULES_QUERY_KEY, id],
    queryFn: () => fetchCommunityRegulatoryRuleById(id),
    enabled: enabled && !!id,
    staleTime: 30000,
  })
}

/**
 * Hook to create new community regulatory rule
 */
export function useCreateCommunityRegulatoryRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<CommunityRegulatoryRule>) => createCommunityRegulatoryRule(data),
    onSuccess: () => {
      // Invalidate and refetch community regulatory rules list
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_REGULATORY_RULES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to update existing community regulatory rule
 */
export function useUpdateCommunityRegulatoryRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CommunityRegulatoryRule> }) =>
      updateCommunityRegulatoryRule(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific community regulatory rule and list
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_REGULATORY_RULES_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_REGULATORY_RULES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to delete community regulatory rule
 */
export function useDeleteCommunityRegulatoryRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCommunityRegulatoryRule(id),
    onSuccess: () => {
      // Invalidate community regulatory rules list
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_REGULATORY_RULES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to apply regulatory rules to a community
 */
export function useApplyRegulatoryRulesToCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: ApplyRegulatoryRulesParams) => applyRegulatoryRulesToCommunity(params),
    onSuccess: (_, variables) => {
      // Invalidate community-specific data
      queryClient.invalidateQueries({ queryKey: ['communities', variables.communityId] })
    },
  })
}

/**
 * Hook to bulk import community regulatory rules
 */
export function useBulkImportCommunityRegulatoryRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => bulkImportCommunityRegulatoryRules(file),
    onSuccess: () => {
      // Invalidate community regulatory rules list
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_REGULATORY_RULES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to delete a community
 */
export function useDeleteRegulatoryRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ruleId: string) => deleteRegulatoryRule(ruleId),
    onSuccess: () => {
      // Invalidate regulatory rules list
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_REGULATORY_RULES_QUERY_KEY] })
    },
  })
}
