"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import MunicipalityManagement from "@/components/municipality-management"
import { getMunicipalities } from "@/lib/sites"
import type { Municipality } from "@/lib/supabase"

export default function MunicipalitiesPage() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const municipalitiesData = await getMunicipalities({ page_size: 1000 })
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
        <MunicipalityManagement municipalities={municipalities} setMunicipalities={setMunicipalities} />
      )}
    </DashboardLayout>
  )
}
