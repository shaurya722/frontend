"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import MapView from "@/components/map-view"
import { getSitesForMap, getMunicipalities } from "@/lib/sites"
import type { CollectionSite, Municipality } from "@/lib/supabase"

export default function MapPage() {
  const [sites, setSites] = useState<CollectionSite[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sitesData, municipalitiesData] = await Promise.all([
          getSitesForMap(),
          getMunicipalities({ page_size: 1000 })
        ])
        setSites(sitesData || [])
        // Transform ApiMunicipality to Municipality
        const transformedMunicipalities: Municipality[] = municipalitiesData.results.map(m => ({
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
        setMunicipalities(transformedMunicipalities)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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
