"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ReportsExport from "@/components/reports-export"
import { getSites, getMunicipalities } from "@/lib/sites"
import { calculateCompliance } from "@/lib/compliance"
import type { CollectionSite, Municipality } from "@/lib/supabase"

type ComplianceData = {
  totalSites: number
  compliantMunicipalities: number
  totalMunicipalities: number
  shortfalls: number
  excesses: number
}

export default function ReportsPage() {
  const [sites, setSites] = useState<CollectionSite[]>([])
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
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
        const municipalitiesData: Municipality[] = municipalitiesResponse.results.map(m => ({
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
        setMunicipalities(municipalitiesData)

        if (sitesData && municipalitiesData) {
          const complianceResults = await calculateCompliance(municipalitiesData, sitesData)
          const compliance: ComplianceData = {
            totalSites: sitesData.length,
            compliantMunicipalities: complianceResults.filter((r) => r.status === "compliant").length,
            totalMunicipalities: municipalitiesData.length,
            shortfalls: complianceResults.reduce((sum, r) => sum + r.shortfall, 0),
            excesses: complianceResults.reduce((sum, r) => sum + r.excess, 0),
          }
          setComplianceData(compliance)
        }
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
      title="Reports & Export"
      description="Generate and export compliance reports"
      breadcrumb={["Dashboard", "Reports & Export"]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      ) : (
        <ReportsExport sites={sites} municipalities={municipalities} complianceData={complianceData} />
      )}
    </DashboardLayout>
  )
}
