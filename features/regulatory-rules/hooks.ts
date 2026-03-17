// Regulatory Rules React Query hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchRegulatoryRules,
  fetchRegulatoryRuleById,
  createRegulatoryRule,
  updateRegulatoryRule,
  deleteRegulatoryRule,
} from './api'
import type {
  RegulatoryRule,
  RegulatoryRulesQueryParams,
  CreateRegulatoryRuleDto,
  UpdateRegulatoryRuleDto,
  RegulatoryRulesResponse,
} from './types'

export const REGULATORY_RULES_QUERY_KEY = 'regulatory-rules'

/**
 * Hook to fetch all regulatory rules with filters and pagination
 */
export function useRegulatoryRules(params: RegulatoryRulesQueryParams = {}) {
  return useQuery<RegulatoryRulesResponse>({
    queryKey: [REGULATORY_RULES_QUERY_KEY, params],
    queryFn: () => fetchRegulatoryRules(params),
    staleTime: 0, // Disable caching for debugging
  })
}

/**
 * Hook to fetch single regulatory rule by ID
 */
export function useRegulatoryRule(id: string, enabled = true) {
  return useQuery({
    queryKey: [REGULATORY_RULES_QUERY_KEY, id],
    queryFn: () => fetchRegulatoryRuleById(id),
    enabled: enabled && !!id,
    staleTime: 30000,
  })
}

/**
 * Hook to create new regulatory rule
 */
export function useCreateRegulatoryRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateRegulatoryRuleDto) => createRegulatoryRule(data),
    onSuccess: () => {
      // Invalidate and refetch regulatory rules list
      queryClient.invalidateQueries({ queryKey: [REGULATORY_RULES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to update existing regulatory rule
 */
export function useUpdateRegulatoryRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRegulatoryRuleDto }) =>
      updateRegulatoryRule(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific regulatory rule and list
      queryClient.invalidateQueries({ queryKey: [REGULATORY_RULES_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [REGULATORY_RULES_QUERY_KEY] })
    },
  })
}

/**
 * Hook to delete regulatory rule
 */
export function useDeleteRegulatoryRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteRegulatoryRule(id),
    onSuccess: () => {
      // Invalidate regulatory rules list
      queryClient.invalidateQueries({ queryKey: [REGULATORY_RULES_QUERY_KEY] })
    },
  })
}
