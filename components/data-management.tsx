"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Database, RefreshCw, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react"

interface DataManagementProps {
  onDataImport?: (data: any) => void
}

export default function DataManagement({ onDataImport }: DataManagementProps) {
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    success: number
    errors: number
    warnings: string[]
  } | null>(null)

  const handleSiteImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)

    // Simulate import process
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsImporting(false)
          setImportResults({
            success: 45,
            errors: 2,
            warnings: [
              "3 sites missing census subdivision data - using municipality as fallback",
              "1 site has invalid coordinates - geocoding required",
            ],
          })
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleCensusDataUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)

    // Simulate census data processing
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsImporting(false)
          setImportResults({
            success: 444,
            errors: 0,
            warnings: [
              "Population data updated for 444 census subdivisions",
              "Compliance requirements automatically recalculated",
              "12 municipalities now have different site requirements",
            ],
          })
          return 100
        }
        return prev + 5
      })
    }, 300)
  }

  const exportSiteData = (format: "csv" | "excel") => {
    // Mock export functionality
    console.log(`Exporting site data as ${format}`)
    alert(`Site data would be exported as ${format.toUpperCase()} file with all historical records`)
  }

  const exportComplianceReport = () => {
    console.log("Exporting compliance report")
    alert("Compliance report would be exported with current census subdivision requirements")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Import/export site data, update census information, and manage historical records
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="census">Census Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Site Data</CardTitle>
              <CardDescription>
                Upload CSV or Excel files with site information. Historical records will be preserved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-import">Site Data File</Label>
                <Input
                  id="site-import"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleSiteImport}
                  disabled={isImporting}
                />
                <p className="text-sm text-gray-600">
                  Required columns: Name, Address, Municipality, Census_Subdivision, Programs, Site_Type,
                  Active_Start_Date
                </p>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing import...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              {importResults && (
                <Alert
                  className={
                    importResults.errors > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"
                  }
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        Import completed: {importResults.success} successful, {importResults.errors} errors
                      </div>
                      {importResults.warnings.map((warning, index) => (
                        <div key={index} className="text-sm">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Import Guidelines:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Sites are never deleted - only deactivated with historical tracking</li>
                  <li>• Seasonal depots are treated as full depots (effective Jan 1, 2025)</li>
                  <li>• Census subdivision is required for regulatory compliance</li>
                  <li>• Active dates must be provided for audit trail</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Site Data</CardTitle>
              <CardDescription>
                Download current site data with historical records and compliance status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => exportSiteData("csv")} className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Export as CSV
                </Button>
                <Button onClick={() => exportSiteData("excel")} variant="outline" className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Export as Excel
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={exportComplianceReport}
                  variant="outline"
                  className="w-full flex items-center gap-2 bg-transparent"
                >
                  <Download className="w-4 h-4" />
                  Export Compliance Report
                </Button>
                <p className="text-sm text-gray-600">
                  Includes census subdivision requirements, site type breakdown, and reallocation status
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Export Features:</h4>
                <ul className="text-sm space-y-1">
                  <li>• All active and deactivated sites with historical dates</li>
                  <li>• Census subdivision compliance calculations</li>
                  <li>• Site type breakdown (Municipal, Seasonal, Return-to-Retail, Events)</li>
                  <li>• Reallocation tracking and validation status</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="census" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Census Data Updates</CardTitle>
              <CardDescription>
                Upload new census data to automatically recalculate compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="census-import">Census Data File</Label>
                <Input
                  id="census-import"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleCensusDataUpdate}
                  disabled={isImporting}
                />
                <p className="text-sm text-gray-600">
                  Required columns: Census_Subdivision_Name, Population, Province, Region
                </p>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing census update...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              {importResults && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        Census update completed: {importResults.success} subdivisions updated
                      </div>
                      {importResults.warnings.map((warning, index) => (
                        <div key={index} className="text-sm">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button className="w-full flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Recalculate All Compliance Requirements
              </Button>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Census Update Process:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Automatically updates population data for all 444+ census subdivisions</li>
                  <li>• Recalculates site requirements based on new population figures</li>
                  <li>• Maintains historical compliance calculations for audit purposes</li>
                  <li>• Generates impact report showing requirement changes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
