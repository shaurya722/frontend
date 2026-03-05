import { useQuery } from '@tanstack/react-query';
import { fetchCompliance } from './api';
import { ComplianceFilters } from './types';

export const useCompliance = (filters: ComplianceFilters) => {
  return useQuery({
    queryKey: ['compliance', filters],
    queryFn: () => fetchCompliance(filters),
  });
};
