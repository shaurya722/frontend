"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SiteManagement from "@/components/site-management"
import { getSitesPaginated, getMunicipalities, type PaginatedSitesResponse } from "@/lib/sites"
import type { CollectionSite, Municipality } from "@/lib/supabase"
import type { SiteFilters } from "@/lib/api"
import { getSiteStatistics } from "@/lib/api"

export default function SitesPage() {
  const [sites, setSites] = useState<CollectionSite[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Partial<SiteFilters>>({})
  const [sortField, setSortField] = useState("")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  // Statistics state
  const [statistics, setStatistics] = useState<{
    total: number
    active: number
    scheduled: number
    inactive: number
    filtered: number
  }>({
    total: 0,
    active: 0,
    scheduled: 0,
    inactive: 0,
    filtered: 0,
  })

  const loadSites = useCallback(async (
    page: number, 
    size: number,
    search?: string,
    filterParams?: Partial<SiteFilters>,
    sort?: string,
    direction?: 'asc' | 'desc'
  ) => {
    setIsLoading(true)
    try {
      // Build filter object for API
      const apiFilters: SiteFilters = {
        page,
        page_size: size,
        ...filterParams,
      }
      
      // Add search if provided
      if (search) {
        apiFilters.search = search
      }
      
      // Add ordering if provided
      if (sort) {
        apiFilters.ordering = direction === 'desc' ? `-${sort}` : sort
      }
      
      // Fetch sites and statistics in parallel
      const [sitesResult, statsResult] = await Promise.all([
        getSitesPaginated(page, size, apiFilters),
        getSiteStatistics(apiFilters)
      ])
      
      setSites(sitesResult.sites)
      setTotalPages(sitesResult.totalPages)
      setTotalItems(sitesResult.total)
      setHasNext(sitesResult.hasNext)
      setHasPrevious(sitesResult.hasPrevious)
      setCurrentPage(sitesResult.page)
      
      // Update statistics if available
      if (statsResult.data) {
        setStatistics(statsResult.data)
      }
    } catch (error) {
      console.error("Error loading sites:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load municipalities once on mount
  useEffect(() => {
    const loadMunicipalities = async () => {
      try {
        const municipalitiesData = await getMunicipalities({ page_size: 1000 })
        const municipalityList = municipalitiesData.results.map(m => ({
          id: m.id,
          name: m.name,
          population: m.population,
          tier: m.tier,
          region: m.region,
          province: m.province,
          census_year: m.census_year,
          created_at: m.created_at,
          updated_at: m.updated_at,
        }))
        setMunicipalities(municipalityList)
      } catch (error) {
        console.error("Error loading municipalities:", error)
      }
    }
    loadMunicipalities()
  }, [])

  // Load sites when dependencies change
  useEffect(() => {
    loadSites(currentPage, pageSize, searchTerm, filters, sortField, sortDirection)
  }, [currentPage, pageSize, searchTerm, filters, sortField, sortDirection, loadSites])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field)
    setSortDirection(direction)
  }

  const handleRefresh = useCallback(() => {
    loadSites(currentPage, pageSize, searchTerm, filters, sortField, sortDirection)
  }, [loadSites, currentPage, pageSize, searchTerm, filters, sortField, sortDirection])

  return (
    <DashboardLayout
      title="Site Management"
      description="Manage collection sites and their configurations"
      breadcrumb={["Dashboard", "Site Management"]}
    >
      {isLoading && sites.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sites...</p>
          </div>
        </div>
      ) : (
        <SiteManagement 
          sites={sites} 
          setSites={setSites} 
          municipalities={municipalities}
          // Pagination props
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={totalItems}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          // Search, filter, and sort callbacks
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          // Statistics from API
          statistics={statistics}
        />
      )}
    </DashboardLayout>
  )
}
