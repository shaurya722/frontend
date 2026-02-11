"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import ReallocationTools from "@/components/reallocation-tools"
import type { CollectionSite, Municipality } from "@/lib/supabase"

export default function ReallocationPage() {
  // Static mock data for sites
  const sites: CollectionSite[] = [
    {
      id: "1",
      name: "Downtown Collection Site",
      address: "123 Main St, Vancouver, BC",
      municipality_id: "1",
      site_type: "Collection Site",
      operator_type: "Municipal",
      programs: ["Paint", "Lighting"],
      status: "Active",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
  ]

  const municipalities: Municipality[] = [
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
  ]

  const isLoading = false

  return (
    <DashboardLayout
      title="Reallocation Tools"
      description="Manage site reallocations and transfers"
      breadcrumb={["Dashboard", "Reallocation Tools"]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reallocation data...</p>
          </div>
        </div>
      ) : (
        <ReallocationTools sites={sites} municipalities={municipalities} />
      )}
    </DashboardLayout>
  )
}
