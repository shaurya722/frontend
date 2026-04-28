import axiosInstance from '@/lib/axios-instance'
import {
  ReportConfig,
  ReportPreviewData,
  PreviewPayload,
  ExportPayload,
} from './types'

export const fetchReportConfig = async (
  year: number
): Promise<ReportConfig> => {
  const response = await axiosInstance.get<ReportConfig>(
    `/api/compliance/reports/config/?year=${year}`
  )
  return response.data
}

export const fetchReportPreview = async (
  payload: PreviewPayload
): Promise<ReportPreviewData> => {
  const response = await axiosInstance.post<ReportPreviewData>(
    '/api/compliance/reports/preview/',
    payload
  )
  return response.data
}

export const exportReport = async (
  payload: ExportPayload
): Promise<Blob> => {
  const response = await axiosInstance.post<Blob>(
    '/api/compliance/reports/export/',
    payload,
    { responseType: 'blob' }
  )
  return response.data
}
