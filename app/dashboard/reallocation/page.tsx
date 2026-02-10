"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ReallocationTools from "@/components/reallocation-tools"
import { getSites, getMunicipalities } from "@/lib/sites"
import type { CollectionSite, Municipality } from "@/lib/supabase"

export default function ReallocationPage() {
  const [sites, setSites] = useState<CollectionSite[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sitesData, municipalitiesResponse] = await Promise.all([
          getSites(),
          getMunicipalities({ page_size: 1000 })
        ])
        setSites(sitesData || [])
        // Transform ApiMunicipality to Municipality
        const transformedMunicipalities: Municipality[] = municipalitiesResponse.results.map(m => ({
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
