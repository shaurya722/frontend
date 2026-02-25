import axiosInstance from '@/lib/axios-instance'
import type { RegionsResponse, Region } from './types'

export async function fetchRegions(): Promise<Region[]> {
  const response = await axiosInstance.get<RegionsResponse>('/regions/dropdown/')
  return response.data.data
}
