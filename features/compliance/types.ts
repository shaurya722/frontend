export interface ComplianceCalculation {
  id: number;
  community: string;
  community_name: string;
  census_year: number;
  census_year_value: number;
  program: string;
  base_required_sites: number;
  sites_from_requirements: number;
  sites_from_adjacent: number;
  sites_from_events: number;
  net_direct_service_offset: number;
  direct_service_offset_percentage: number | null;
  direct_service_offset_source: string;
  required_sites: number;
  actual_sites: number;
  shortfall: number;
  excess: number;
  compliance_rate: string;
  status: string;
  calculation_date: string;
  created_by: string | null;
  created_by_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceSummary {
  compliant_communities: number;
  shortfalls: number;
  excesses: number;
  overall_rate: number;
  total_sites: number;
}

export interface PaginatedComplianceResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ComplianceCalculation[];
  summary: ComplianceSummary;
}

export interface ComplianceFilters {
  program?: string;
  community?: string;
  year?: string;
  status?: 'compliant' | 'shortfall' | 'excess';
  search?: string;
  ordering?: string;
  page?: number;
  limit?: number;
}
