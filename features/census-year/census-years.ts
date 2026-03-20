// Census Years API functions

import axiosInstance from '@/lib/axios-instance'

export interface CensusYear {
  id: number
  year: number
}

export interface CensusYearsResponse {
  count: number
  next: string | null
  previous: string | null
  results: CensusYear[]
}

export interface CreateCensusYearData {
  year: number
}

export interface UpdateCensusYearData {
  year: number
}

export interface GetCensusYearsParams {
  page?: number
  limit?: number
}

/**
 * Fetch all census years with pagination
 */
export async function getCensusYears(params?: GetCensusYearsParams): Promise<CensusYearsResponse> {
  const queryParams = new URLSearchParams()
  if (params?.page) {
    queryParams.set('page', params.page.toString())
  }
  if (params?.limit) {
    queryParams.set('limit', params.limit.toString())
  }
  
  const url = `/api/community/year-data/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  const response = await axiosInstance.get<CensusYearsResponse>(url)
  return response.data
}

/**
 * Create a new census year
 */
export async function createCensusYear(data: CreateCensusYearData): Promise<CensusYear> {
  const response = await axiosInstance.post<CensusYear>(
    '/api/community/years/',
    data
  )
  return response.data
}

/**
 * Update a census year
 */
export async function updateCensusYear(id: number, data: UpdateCensusYearData): Promise<CensusYear> {
  const response = await axiosInstance.put<CensusYear>(
    `/api/community/years/${id}/`,
    data
  )
  return response.data
}

/**
 * Delete a census year
 */
export async function deleteCensusYear(id: number): Promise<void> {
  await axiosInstance.delete(`/api/community/years/${id}/`)
}

// Export as object for convenience
export const censusYearsApi = {
  list: getCensusYears,
  create: createCensusYear,
  update: updateCensusYear,
  delete: deleteCensusYear,
}
