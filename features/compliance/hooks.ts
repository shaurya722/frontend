import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCompliance, recalculateCompliance } from './api';
import { ComplianceFilters } from './types';

export const COMPLIANCE_QUERY_KEY = 'compliance'

export const useCompliance = (filters: ComplianceFilters) => {
  return useQuery({
    queryKey: [COMPLIANCE_QUERY_KEY, filters],
    queryFn: () => fetchCompliance(filters),
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
