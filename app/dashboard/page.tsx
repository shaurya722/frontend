"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, AlertTriangle, CheckCircle, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getSites, getMunicipalities } from "@/lib/sites"
import { calculateCompliance } from "@/lib/compliance"
import type { Municipality } from "@/lib/supabase"

interface ComplianceData {
  totalSites: number
  compliantMunicipalities: number
  totalMunicipalities: number
  shortfalls: number
  excesses: number
}

export default function Dashboard() {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [sitesData, municipalitiesResponse] = await Promise.all([
          getSites(),
          getMunicipalities({ page_size: 1000 })
        ])

        if (sitesData && municipalitiesResponse) {
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
      title="Dashboard"
      description="Ontario HSP & EEE Collection Site Assessment Overview"
      breadcrumb={["Dashboard", "Overview"]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceData?.totalSites || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across {complianceData?.totalMunicipalities || 0} municipalities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {complianceData
                  ? Math.round((complianceData.compliantMunicipalities / complianceData.totalMunicipalities) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {complianceData?.compliantMunicipalities || 0} of {complianceData?.totalMunicipalities || 0} compliant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shortfalls</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{complianceData?.shortfalls || 0}</div>
              <p className="text-xs text-muted-foreground">Sites needed for compliance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excesses</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{complianceData?.excesses || 0}</div>
              <p className="text-xs text-muted-foreground">Available for reallocation</p>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
