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

interface MapFilters {
  status: string
  programs: string[]
  municipality: string
  operatorTypes: string[]
  siteTypes: string[]
  performancePeriod: string
  tier: string
  minPopulation: string
  maxPopulation: string
  hasCoordinates: string
  page?: number
  limit?: number
  municipalities_page?: number
  municipalities_limit?: number
}

export const useMapData = (filters: MapFilters) => {
  return useQuery<MapDataResponse>({
    queryKey: ['mapData', filters],
    queryFn: async () => {
      const apiUrl = new URL('http://localhost:8000/api/community/map-data/')
      if (filters.performancePeriod !== 'all') {
        apiUrl.searchParams.set('census_year', filters.performancePeriod)
      }
      if (filters.siteTypes.length > 0) {
        filters.siteTypes.forEach(type => apiUrl.searchParams.append('site_types', type))
      }
      if (filters.status !== 'all') {
        apiUrl.searchParams.set('status', filters.status)
      }
      if (filters.operatorTypes.length > 0) {
        filters.operatorTypes.forEach(type => apiUrl.searchParams.append('operator_types', type))
      }
      if (filters.programs.length > 0) {
        filters.programs.forEach(program => apiUrl.searchParams.append('programs', program))
      }
      if (filters.page) {
        apiUrl.searchParams.set('page', filters.page.toString())
      }
      if (filters.limit) {
        apiUrl.searchParams.set('limit', filters.limit.toString())
      }
      if (filters.municipalities_page) {
        apiUrl.searchParams.set('municipalities_page', filters.municipalities_page.toString())
      }
      if (filters.municipalities_limit) {
        apiUrl.searchParams.set('municipalities_limit', filters.municipalities_limit.toString())
      }
      const response = await fetch(apiUrl.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch map data')
      }
      return response.json()
    },
  })
}
