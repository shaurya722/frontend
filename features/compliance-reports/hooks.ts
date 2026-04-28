import { useQuery, useMutation } from '@tanstack/react-query'
import {
  fetchReportConfig,
  fetchReportPreview,
  exportReport,
} from './api'
import { PreviewPayload, ExportPayload } from './types'

export const REPORT_CONFIG_KEY = 'report-config'
export const REPORT_PREVIEW_KEY = 'report-preview'

export const useReportConfig = (year: number) => {
  return useQuery({
    queryKey: [REPORT_CONFIG_KEY, year],
    queryFn: () => fetchReportConfig(year),
    enabled: !!year,
  })
}

export const useReportPreview = () => {
  return useMutation({
    mutationFn: (payload: PreviewPayload) => fetchReportPreview(payload),
  })
}

export const useExportReport = () => {
  return useMutation({
    mutationFn: (payload: ExportPayload) => exportReport(payload),
  })
}
