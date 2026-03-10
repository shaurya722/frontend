import { useQuery } from '@tanstack/react-query'

interface Municipality {
  id: string
  name: string
  tier: string
  population: number
}

interface CollectionSite {
  id: string
  name: string
  address: string
  status: string
  operator_type: string
  site_type: string
  latitude: number
  longitude: number
  programs: string[]
  municipality?: { name: string }
  population_served?: number
  created_at?: string
  active_dates?: string
}

interface CensusYear {
  id: number
  year: number
}

interface MapDataResponse {
  sites: CollectionSite[]
  municipalities: Municipality[]
  census_year: CensusYear
}

export const useMapData = (performancePeriod: string) => {
  return useQuery<MapDataResponse>({
    queryKey: ['mapData', performancePeriod],
    queryFn: async () => {
      const apiUrl = new URL('http://localhost:8000/api/community/map-data/')
      if (performancePeriod !== 'all') {
        apiUrl.searchParams.set('census_year', performancePeriod)
      }
      const response = await fetch(apiUrl.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch map data')
      }
      return response.json()
    },
  })
}
