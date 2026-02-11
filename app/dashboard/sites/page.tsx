"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import SiteManagement from "@/components/site-management"
import type { CollectionSite, Municipality } from "@/lib/supabase"

export default function SitesPage() {
  // Static mock data for sites
  const [sites] = useState<CollectionSite[]>([
    {
      id: "1",
      name: "Downtown Collection Site",
      address: "123 Main St, Vancouver, BC",
      municipality_id: "1",
      municipality: {
        id: "1",
        name: "Vancouver",
        population: 630000,
        tier: "Upper",
        region: "Lower Mainland",
        province: "BC",
        census_year: 2021,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
      site_type: "Collection Site",
      operator_type: "Municipal",
      materials_collected: ["Plastic", "Glass"],
      programs: ["Paint", "Lighting"],
      status: "Active",
      latitude: 49.2827,
      longitude: -123.1207,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "West End Depot",
      address: "456 Oak St, Victoria, BC",
      municipality_id: "2",
      municipality: {
        id: "2",
        name: "Victoria",
        population: 92000,
        tier: "Single",
        region: "Vancouver Island",
        province: "BC",
        census_year: 2021,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
      site_type: "Collection Site",
      operator_type: "Regional District",
      materials_collected: ["Paper", "Metal"],
      programs: ["Solvents", "Pesticides"],
      status: "Active",
      latitude: 48.4284,
      longitude: -123.3656,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
  ])

  const [municipalities] = useState<Municipality[]>([
    {
      id: "1",
      name: "Vancouver",
      population: 630000,
      tier: "Upper",
      region: "Lower Mainland",
      province: "BC",
      census_year: 2021,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Victoria",
      population: 92000,
      tier: "Single",
      region: "Vancouver Island",
      province: "BC",
      census_year: 2021,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
  ])

  const isLoading = false
  
  // Static pagination state
  const currentPage = 1
  const pageSize = 10
  const totalPages = 1
  const totalItems = 2
  const hasNext = false
  const hasPrevious = false
  
  // Static statistics
  const statistics = {
    total: 2,
    active: 2,
    scheduled: 0,
    inactive: 0,
    filtered: 2,
  }

  // Empty handler functions for UI
  const handlePageChange = () => {}
  const handlePageSizeChange = () => {}
  const handleSearchChange = () => {}
  const handleFilterChange = () => {}
  const handleSortChange = () => {}
  const handleRefresh = () => {}

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
