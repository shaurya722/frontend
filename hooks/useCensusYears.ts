import { useQuery } from '@tanstack/react-query'

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
      const response = await fetch('http://127.0.0.1:8000/api/community/years/')
      if (!response.ok) {
        throw new Error('Failed to fetch census years')
      }
      return response.json()
    },
  })
}
