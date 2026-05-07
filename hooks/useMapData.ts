import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/lib/axios-instance'

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
  search?: string
  community_search?: string
  page?: number
  limit?: number
  municipalities_page?: number
  municipalities_limit?: number
}

export const useMapData = (filters: MapFilters) => {
  return useQuery<MapDataResponse>({
    queryKey: ['mapData', filters],
    queryFn: async () => {
      const params: Record<string, any> = {}
      if (filters.performancePeriod && filters.performancePeriod !== 'all') {
        params.census_year = filters.performancePeriod
      }
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status
      }
      if (filters.search && filters.search.trim().length > 0) {
        params.search = filters.search
      }
      if (filters.community_search && filters.community_search.trim().length > 0) {
        params.community_search = filters.community_search
      }
      if (filters.page) params.page = filters.page
      if (filters.limit) params.limit = filters.limit
      if (filters.municipalities_page) params.municipalities_page = filters.municipalities_page
      if (filters.municipalities_limit) params.municipalities_limit = filters.municipalities_limit
      if (Array.isArray(filters.siteTypes) && filters.siteTypes.length > 0) {
        params.site_types = filters.siteTypes
      }
      if (Array.isArray(filters.operatorTypes) && filters.operatorTypes.length > 0) {
        params.operator_types = filters.operatorTypes
      }
      if (Array.isArray(filters.programs) && filters.programs.length > 0) {
        params.programs = filters.programs
      }
      if (filters.municipality && filters.municipality !== 'all') {
        params.communities = filters.municipality
      }

      const res = await axiosInstance.get<MapDataResponse>('/api/community/map-data/', {
        params,
      })
      return res.data
    },
  })
}
