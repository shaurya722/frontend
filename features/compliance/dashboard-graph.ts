import axiosInstance from '@/lib/axios-instance'

export interface ComplianceDashboardCensusYearRef {
  id: number
  year: number
}

export interface ComplianceDashboardChartColors {
  navy: string
  royal: string
  light_blue: string
  sky_fill: string
}

export interface ComplianceDashboardKpi {
  total_sites: number
  municipalities_tracked: number
  municipalities_with_calculations: number
  compliance_rate_avg_program_rows: number
  compliance_rate_municipalities_pct: number
  municipalities_compliant_no_shortfall: number
  municipalities_with_shortfall: number
  municipalities_balanced: number
  municipalities_excess_only: number
  municipalities_with_any_excess: number
  total_shortfall_units: number
  total_excess_units: number
  total_site_rows:number
  /** Optional: number of active site rows, if backend provides it */
  active_site_rows?: number
}

/** Includes index signature for Recharts `Pie` / `ChartDataInput` compatibility */
export interface ComplianceDashboardDonutSlice {
  name: string
  value: number
  fill: string
  [key: string]: string | number
}

export interface ComplianceDashboardDonutLegendRow {
  name: string
  label: string
  count: number
}

export interface ComplianceDashboardProgramRow {
  program: string
  program_display: string
  compliant_communities: number
  shortfall_communities: number
  compliant: number
  shortfall: number
}

export interface ComplianceDashboardTopCommunity {
  name: string
  sites: number
}

/** Optional — when backend supplies pre-aggregated event counts per municipality */
export interface ComplianceDashboardTopCommunityEvents {
  name: string
  events: number
}

export interface ComplianceDashboardEndDateBucket {
  label: string
  key: string
  count: number
  pct: number
  fill: string
}

export interface ComplianceDashboardEndDateBarRow {
  bucket: string
  sites: number
  fill: string
}

export interface ComplianceDashboardSiteEndingSoon {
  site: string
  sub: string
  program: string
  status: string
  updated: string
  site_end_date?: string
}

export interface ComplianceDashboardTrendPoint {
  year: number
  census_year_id: number
  rate: number
}

export interface ComplianceDashboardMonthlyPoint {
  month: string
  rate: number
}

export interface ComplianceDashboardTrend {
  by_census_year: ComplianceDashboardTrendPoint[]
  monthly: ComplianceDashboardMonthlyPoint[]
  monthly_synthetic?: boolean
  monthly_note?: string | null
}

export interface ComplianceDashboardMeta {
  exclude_events: boolean
  programs: string[]
}

/** Optional compliance summary block returned by some backends */
export interface ComplianceDashboardComplianceSummary {
  compliant_communities: number
  shortfalls: number
  excesses: number
  overall_rate: number
  total_sites: number
}

export interface ComplianceDashboardGraphResponse {
  census_year: ComplianceDashboardCensusYearRef
  chart_colors: ComplianceDashboardChartColors
  kpi: ComplianceDashboardKpi
  donut: ComplianceDashboardDonutSlice[]
  donut_legend: ComplianceDashboardDonutLegendRow[]
  program_compliance: ComplianceDashboardProgramRow[]
  top_communities: ComplianceDashboardTopCommunity[]
  /** Optional precomputed ranking; otherwise UI derives from event listing */
  top_communities_events?: ComplianceDashboardTopCommunityEvents[]
  end_date_buckets: ComplianceDashboardEndDateBucket[]
  end_date_bar_chart: ComplianceDashboardEndDateBarRow[]
  sites_ending_soon: ComplianceDashboardSiteEndingSoon[]
  trend: ComplianceDashboardTrend
  meta: ComplianceDashboardMeta
  /** Optional summary rollup */
  compliance_summary?: ComplianceDashboardComplianceSummary
}

export interface ComplianceDashboardGraphParams {
  year: number
  exclude_events?: boolean
  top_communities_limit?: number
  sites_table_limit?: number
}

export async function fetchComplianceDashboardGraph(
  params: ComplianceDashboardGraphParams,
): Promise<ComplianceDashboardGraphResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('year', String(params.year))
  if (params.exclude_events !== undefined) {
    searchParams.set('exclude_events', params.exclude_events ? 'true' : 'false')
  }
  if (params.top_communities_limit != null) {
    searchParams.set('top_communities_limit', String(params.top_communities_limit))
  }
  if (params.sites_table_limit != null) {
    searchParams.set('sites_table_limit', String(params.sites_table_limit))
  }

  const response = await axiosInstance.get<ComplianceDashboardGraphResponse>(
    `/api/compliance/dashboard/graph/?${searchParams.toString()}`,
  )
  return response.data
}
