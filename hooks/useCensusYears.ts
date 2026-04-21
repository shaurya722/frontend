import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios-instance'

export interface CensusYear {
  id: number
  year: number
}

interface CensusYearsResponse {
  years: CensusYear[]
}

export const useCensusYears = () => {
  return useQuery<CensusYearsResponse>({
    queryKey: ['censusYears'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/community/years/')
      return data
    },
  })
}
