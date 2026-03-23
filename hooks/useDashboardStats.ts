import { useQuery } from '@tanstack/react-query'
import { useCompliance } from '@/features/compliance/hooks'
import { useCensusYearsList } from '@/features/census-year/useCensusYearsManagement'

export interface DashboardStats {
  totalSites: number
  totalMunicipalities: number
  compliantMunicipalities: number
  complianceRate: number
  shortfalls: number
  excesses: number
  totalCensusYears: number
  latestYear: number | null
  programBreakdown: {
    program: string
    sites: number
    compliant: number
    shortfall: number
  }[]
}

export const useDashboardStats = (year?: number) => {
  // Fetch compliance data with summary
  const { data: complianceData, isLoading: complianceLoading } = useCompliance({
    year: year?.toString(),
    limit: 1000, // Get all for accurate stats
  })

  // Fetch census years
  const { data: censusYearsData, isLoading: yearsLoading } = useCensusYearsList({
    page: 1,
    limit: 100,
  })

  // Fetch map data for site counts
  const { data: mapData, isLoading: mapLoading } = useQuery({
    queryKey: ['dashboardMapData', year],
    queryFn: async () => {
      const apiUrl = new URL('http://localhost:8000/api/community/map-data/')
      if (year) {
        apiUrl.searchParams.set('census_year', year.toString())
      }
      const response = await fetch(apiUrl.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch map data')
      }
      return response.json()
    },
  })

  const isLoading = complianceLoading || yearsLoading || mapLoading

  // Calculate statistics
  const stats: DashboardStats = {
    totalSites: mapData?.sites?.length || complianceData?.summary?.total_sites || 0,
    totalMunicipalities: mapData?.municipalities?.length || 0,
    compliantMunicipalities: complianceData?.summary?.compliant_communities || 0,
    complianceRate: complianceData?.summary?.overall_rate || 0,
    shortfalls: complianceData?.summary?.shortfalls || 0,
    excesses: complianceData?.summary?.excesses || 0,
    totalCensusYears: censusYearsData?.count || 0,
    latestYear: censusYearsData?.results?.[0]?.year || null,
    programBreakdown: [],
  }

  // Calculate program breakdown from compliance results
  if (complianceData?.results) {
    const programMap = new Map<string, { sites: number; compliant: number; shortfall: number }>()
    
    complianceData.results.forEach((item) => {
      const existing = programMap.get(item.program) || { sites: 0, compliant: 0, shortfall: 0 }
      programMap.set(item.program, {
        sites: existing.sites + item.actual_sites,
        compliant: existing.compliant + (item.status === 'compliant' ? 1 : 0),
        shortfall: existing.shortfall + (item.shortfall > 0 ? item.shortfall : 0),
      })
    })

    stats.programBreakdown = Array.from(programMap.entries()).map(([program, data]) => ({
      program,
      ...data,
    }))
  }

  return {
    data: stats,
    isLoading,
    complianceData,
    mapData,
    censusYearsData,
  }
}
