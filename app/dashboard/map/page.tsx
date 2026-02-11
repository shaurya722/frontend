"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import MapView from "@/components/map-view"
import type { CollectionSite, Municipality } from "@/lib/supabase"

export default function MapPage() {
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
      site_type: "Collection Site",
      operator_type: "Regional District",
      programs: ["Solvents", "Pesticides"],
      status: "Active",
      latitude: 48.4284,
      longitude: -123.3656,
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
      title="Map View"
      description="Interactive map showing collection sites and municipal boundaries"
      breadcrumb={["Dashboard", "Map View"]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Interactive Map</CardTitle>
            <CardDescription>View collection sites, municipal boundaries, and compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <MapView sites={sites} municipalities={municipalities} />
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
