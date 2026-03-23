import axiosInstance from '@/lib/axios-instance'
import { PaginatedComplianceResponse, ComplianceFilters } from './types'

export const fetchCompliance = async (
  filters: ComplianceFilters = {}
): Promise<PaginatedComplianceResponse> => {
  const params = new URLSearchParams()

  if (filters.program) params.append('program', filters.program)
  if (filters.community) params.append('community', filters.community)
  if (filters.year) params.append('year', filters.year)
  if (filters.status) params.append('status', filters.status)
  if (filters.search) params.append('search', filters.search)
  if (filters.ordering) params.append('ordering', filters.ordering)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const response = await axiosInstance.get<PaginatedComplianceResponse>(
    `/api/compliance/?${params.toString()}`
  )
  return response.data
};

export const recalculateCompliance = async (censusYearId: number) => {
  const response = await axiosInstance.post('/api/compliance/recalculate/', {
    census_year: censusYearId,
  })

  return response.data
};
