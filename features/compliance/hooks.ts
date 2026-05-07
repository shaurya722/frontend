import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCompliance, recalculateCompliance, exportCompliance } from './api';
import {
  fetchComplianceDashboardGraph,
  type ComplianceDashboardGraphParams,
} from './dashboard-graph';
import { ComplianceFilters } from './types';

export const COMPLIANCE_QUERY_KEY = 'compliance'
export const COMPLIANCE_DASHBOARD_GRAPH_KEY = 'complianceDashboardGraph'

export const useCompliance = (filters: ComplianceFilters, enabled = true) => {
  return useQuery({
    queryKey: [COMPLIANCE_QUERY_KEY, filters],
    queryFn: () => fetchCompliance(filters),
    enabled,
  });
};

export const useRecalculateCompliance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (censusYearId: number) => recalculateCompliance(censusYearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPLIANCE_QUERY_KEY] })
    },
  })
}

export const useExportCompliance = () => {
  return useMutation({
    mutationFn: (filters: ComplianceFilters = {}) => exportCompliance(filters),
  })
}

export function useComplianceDashboardGraph(
  params: ComplianceDashboardGraphParams | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [COMPLIANCE_DASHBOARD_GRAPH_KEY, params],
    queryFn: () => fetchComplianceDashboardGraph(params!),
    enabled:
      enabled &&
      params != null &&
      Number.isFinite(params.year),
  })
}
