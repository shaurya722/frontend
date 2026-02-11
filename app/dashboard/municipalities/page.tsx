"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import MunicipalityManagement from "@/components/municipality-management"
import type { Municipality } from "@/lib/supabase"

export default function MunicipalitiesPage() {
  // Static mock data for municipalities
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
    {
      id: "3",
      name: "Surrey",
      population: 520000,
      tier: "Upper",
      region: "Lower Mainland",
      province: "BC",
      census_year: 2021,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    },
  ]
  const isLoading = false

  return (
    <DashboardLayout
      title="Municipality Management"
      description="Manage municipalities and their data"
      breadcrumb={["Dashboard", "Municipalities"]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading municipalities...</p>
          </div>
        </div>
      ) : (
        <MunicipalityManagement municipalities={municipalities} />
      )}
    </DashboardLayout>
  )
}
