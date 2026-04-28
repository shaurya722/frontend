export interface ReportConfig {
  report_types: { value: string; label: string }[]
  programs: { name: string; active_site_count: number }[]
  municipalities: {
    name: string
    active_site_count: number
    population: number
    tier: string
  }[]
}

export interface DateFilter {
  filterType: 'all' | 'activated' | 'deactivated'
  startDate: string
  endDate: string
}

export interface ReportOptions {
  include_charts: boolean
  include_details: boolean
}

export interface PreviewPayload {
  report_type: string
  year: number
  programs: string[]
  municipalities: string[]
  date_filter: DateFilter
  options: ReportOptions
}

export interface ExportPayload extends PreviewPayload {
  format: 'excel' | 'word' | 'pdf'
}

export interface ComplianceData {
  totalSites: number
  compliantMunicipalities: number
  totalMunicipalities: number
  shortfalls: number
  excesses: number
}

export interface ProgramBreakdownRow {
  program: string
  activeSites: number
  municipalitiesServed: number
  status: string
}

export interface MunicipalitySummaryRow {
  municipality: string
  population: number
  activeSites: number
  programsServed: string[]
  tier: string
}

export interface ReportPreviewData {
  complianceData: ComplianceData
  programBreakdown: ProgramBreakdownRow[]
  municipalitySummary: MunicipalitySummaryRow[]
}
