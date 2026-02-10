"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { FileText, FileSpreadsheet, Printer } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { CollectionSite, Municipality } from "@/lib/supabase"

interface ComplianceData {
  totalSites: number
  compliantMunicipalities: number
  totalMunicipalities: number
  shortfalls: number
  excesses: number
}

interface ReportsExportProps {
  sites?: CollectionSite[]
  municipalities?: Municipality[]
  complianceData?: ComplianceData | null
}

export default function ReportsExport({ sites = [], municipalities = [], complianceData }: ReportsExportProps) {
  const [selectedReportType, setSelectedReportType] = useState("compliance-summary")
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(["Paint", "Lighting", "Solvents", "Pesticides"])
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeDetails, setIncludeDetails] = useState(true)
  const [municipalitySearch, setMunicipalitySearch] = useState("")
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
    filterType: "all", // "activated", "deactivated", "all"
  })

  const programs = ["Paint", "Lighting", "Solvents", "Pesticides", "PaintShare"]

  // Safely handle the arrays
  const safeSites = Array.isArray(sites) ? sites : []
  
  // Deduplicate municipalities by name (global dataset - one per community)
  // Use useMemo to prevent infinite loops
  const safeMunicipalities = useMemo(() => {
    if (!Array.isArray(municipalities)) return []
    const uniqueMap = new Map<string, Municipality>()
    for (const municipality of municipalities) {
      const key = municipality.name.toLowerCase().trim()
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, municipality)
      }
    }
    return Array.from(uniqueMap.values())
  }, [municipalities])

  const reportTypes = [
    { value: "compliance-summary", label: "Compliance Summary Report" },
    { value: "site-inventory", label: "Site Inventory Report" },
    { value: "shortfall-analysis", label: "Shortfall Analysis Report" },
    { value: "reallocation-report", label: "Reallocation Report" },
    { value: "offset-report", label: "Offset Report" },
    { value: "regulatory-compliance", label: "Regulatory Compliance Report" },
    { value: "historical-tracking", label: "Historical Site Changes" },
    { value: "site-type-breakdown", label: "Site Type Breakdown Analysis" },
  ]

  const handleProgramChange = (program: string, checked: boolean) => {
    if (checked) {
      setSelectedPrograms([...selectedPrograms, program])
    } else {
      setSelectedPrograms(selectedPrograms.filter((p) => p !== program))
    }
  }

  const handleMunicipalityChange = (municipality: string, checked: boolean) => {
    if (checked) {
      setSelectedMunicipalities([...selectedMunicipalities, municipality])
    } else {
      setSelectedMunicipalities(selectedMunicipalities.filter((m) => m !== municipality))
    }
  }

  const generateReport = (format: "excel" | "word" | "pdf") => {
    // In a real implementation, this would generate and download the actual report
    console.log(`Generating ${selectedReportType} report in ${format} format`)
    console.log("Selected programs:", selectedPrograms)
    console.log("Selected municipalities:", selectedMunicipalities)
    console.log("Include charts:", includeCharts)
    console.log("Include details:", includeDetails)

    // Mock download
    alert(`${selectedReportType} report would be downloaded as ${format.toUpperCase()} file`)
  }

  const getComplianceRate = () => {
    if (!complianceData) return 0
    return Math.round((complianceData.compliantMunicipalities / complianceData.totalMunicipalities) * 100)
  }

  const getSitesByProgram = (program: string) => {
    return safeSites.filter((site) => {
      return Array.isArray(site.programs) && site.programs.includes(program) && site.status === "Active"
    }).length
  }

  const getSitesByMunicipality = (municipality: string) => {
    return safeSites.filter((site) => site.municipality?.name === municipality && site.status === "Active").length
  }

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Configure and generate compliance reports for export</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Program Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Programs</Label>
              <div className="space-y-2">
                {programs.map((program) => (
                  <div key={program} className="flex items-center space-x-2">
                    <Checkbox
                      id={`program-${program}`}
                      checked={selectedPrograms.includes(program)}
                      onCheckedChange={(checked) => handleProgramChange(program, checked as boolean)}
                    />
                    <Label htmlFor={`program-${program}`} className="text-sm">
                      {program} ({getSitesByProgram(program)} sites)
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Municipality Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Municipalities</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search municipalities..."
                  value={municipalitySearch}
                  onChange={(e) => setMunicipalitySearch(e.target.value)}
                  className="mb-2"
                />

                <Select
                  value={dateFilter.filterType}
                  onValueChange={(value) => setDateFilter({ ...dateFilter, filterType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="activated">Recently Activated</SelectItem>
                    <SelectItem value="deactivated">Recently Deactivated</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={dateFilter.startDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={dateFilter.endDate}
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {safeMunicipalities.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">No municipalities available</div>
                  ) : (
                    safeMunicipalities
                      .filter((m) => m.name.toLowerCase().includes(municipalitySearch.toLowerCase()))
                      .map((municipality) => (
                        <div key={municipality.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`municipality-${municipality.id}`}
                            checked={selectedMunicipalities.includes(municipality.name)}
                            onCheckedChange={(checked) =>
                              handleMunicipalityChange(municipality.name, checked as boolean)
                            }
                          />
                          <Label htmlFor={`municipality-${municipality.id}`} className="text-sm">
                            {municipality.name} ({getSitesByMunicipality(municipality.name)} sites)
                          </Label>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Report Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-charts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                />
                <Label htmlFor="include-charts" className="text-sm">
                  Include charts and visualizations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-details"
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(checked === true)}
                />
                <Label htmlFor="include-details" className="text-sm">
                  Include detailed site information
                </Label>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2 pt-4">
            <Button onClick={() => generateReport("excel")} className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </Button>
            <Button variant="outline" onClick={() => generateReport("word")} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Export to Word
            </Button>
            <Button variant="outline" onClick={() => generateReport("pdf")} className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Export to PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>Preview of {reportTypes.find((t) => t.value === selectedReportType)?.label}</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedReportType === "compliance-summary" && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold">{complianceData?.totalSites || 0}</div>
                    <div className="text-sm text-gray-600">Total Sites</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{getComplianceRate()}%</div>
                    <div className="text-sm text-gray-600">Compliance Rate</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{complianceData?.shortfalls || 0}</div>
                    <div className="text-sm text-gray-600">Shortfalls</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{complianceData?.excesses || 0}</div>
                    <div className="text-sm text-gray-600">Excesses</div>
                  </div>
                </div>
              </div>

              {/* Program Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Program Breakdown</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Active Sites</TableHead>
                      <TableHead>Municipalities Served</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPrograms.map((program) => {
                      const programSites = getSitesByProgram(program)
                      const municipalitiesServed = new Set(
                        safeSites
                          .filter((s) => {
                            return Array.isArray(s.programs) && s.programs.includes(program) && s.status === "Active"
                          })
                          .map((s) => s.municipality?.name)
                          .filter(Boolean),
                      ).size

                      return (
                        <TableRow key={program}>
                          <TableCell>
                            <Badge variant="secondary">{program}</Badge>
                          </TableCell>
                          <TableCell>{programSites}</TableCell>
                          <TableCell>{municipalitiesServed}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Municipality Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Municipality Summary</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Municipality</TableHead>
                      <TableHead>Population</TableHead>
                      <TableHead>Active Sites</TableHead>
                      <TableHead>Programs Served</TableHead>
                      <TableHead>Tier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeMunicipalities
                      .filter((m) => selectedMunicipalities.length === 0 || selectedMunicipalities.includes(m.name))
                      .map((municipality) => {
                        const municipalitySites = getSitesByMunicipality(municipality.name)
                        const programsServed = new Set(
                          safeSites
                            .filter((s) => s.municipality?.name === municipality.name && s.status === "Active")
                            .flatMap((s) => {
                              return Array.isArray(s.programs) ? s.programs : []
                            })
                            .filter((p) => selectedPrograms.includes(p)),
                        )

                        return (
                          <TableRow key={municipality.id}>
                            <TableCell className="font-medium">{municipality.name}</TableCell>
                            <TableCell>{municipality.population.toLocaleString()}</TableCell>
                            <TableCell>{municipalitySites}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Array.from(programsServed).map((program) => (
                                  <Badge key={program} variant="outline" className="text-xs">
                                    {program}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{municipality.tier} Tier</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {selectedReportType === "site-inventory" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Site Inventory</h3>
              {safeSites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No sites available for inventory</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Municipality</TableHead>
                      <TableHead>Programs</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeSites
                      .filter((site) => {
                        return (
                          Array.isArray(site.programs) &&
                          site.programs.some((p) => selectedPrograms.includes(p)) &&
                          (selectedMunicipalities.length === 0 ||
                            selectedMunicipalities.includes(site.municipality?.name || ""))
                        )
                      })
                      .map((site) => {
                        const siteType = site.site_type || "Unknown"

                        return (
                          <TableRow key={site.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{site.name}</div>
                                <div className="text-sm text-gray-600">{site.address}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{siteType}</Badge>
                            </TableCell>
                            <TableCell>{site.municipality?.name || "Not specified"}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {Array.isArray(site.programs) &&
                                  site.programs
                                    .filter((p) => selectedPrograms.includes(p))
                                    .map((program) => (
                                      <Badge key={program} variant="secondary" className="text-xs">
                                        {program}
                                      </Badge>
                                    ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  site.status === "Active"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : site.status === "Scheduled"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                      : "bg-red-100 text-red-800 border-red-200"
                                }
                              >
                                {site.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {selectedReportType === "historical-tracking" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Historical Site Changes</h3>
              {safeSites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No historical data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site Name</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Municipality</TableHead>
                      <TableHead>Census Subdivision</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeSites
                      .filter((site) => {
                        return true
                      })
                      .map((site) => (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">{site.name}</TableCell>
                          <TableCell>
                            <Badge variant={site.status === "Inactive" ? "destructive" : "default"}>
                              {site.status === "Inactive" ? "Deactivated" : "Activated"}
                            </Badge>
                          </TableCell>
                          <TableCell>{site.active_dates || "Not specified"}</TableCell>
                          <TableCell>{site.municipality?.name || "Not specified"}</TableCell>
                          <TableCell>{site.address || "Not specified"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                site.status === "Active"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : site.status === "Inactive"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }
                            >
                              {site.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {selectedReportType !== "compliance-summary" &&
            selectedReportType !== "site-inventory" &&
            selectedReportType !== "historical-tracking" && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Report preview for {reportTypes.find((t) => t.value === selectedReportType)?.label}</p>
                <p className="text-sm">Configure filters and export to view full report</p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
