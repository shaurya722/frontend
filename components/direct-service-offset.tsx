"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Calculator, MapPin, Info } from "lucide-react"
import type { Municipality } from "@/lib/supabase"

interface DirectServiceOffset {
  id: number
  municipality: string
  census_subdivision: string
  annual_volume: number
  percentage_reduction: number
  sites_reduced: number
  geographic_allocation: string[]
  effective_date: string
  status: "active" | "pending" | "expired"
}

interface DirectServiceOffsetProps {
  municipalities: Municipality[]
}

export default function DirectServiceOffset({ municipalities = [] }: DirectServiceOffsetProps) {
  // Deduplicate municipalities by name (global dataset - one per community)
  // Use useMemo to prevent infinite loops
  const safeMunicipalities = useMemo(() => {
    const uniqueMap = new Map<string, Municipality>()
    for (const municipality of municipalities) {
      const key = municipality.name.toLowerCase().trim()
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, municipality)
      }
    }
    return Array.from(uniqueMap.values())
  }, [municipalities])
  
  const [offsets, setOffsets] = useState<DirectServiceOffset[]>([])
  const [newOffset, setNewOffset] = useState({
    municipality: "",
    census_subdivision: "",
    annual_volume: 0,
    percentage_reduction: 0,
    geographic_allocation: [] as string[],
    effective_date: new Date().toISOString().split("T")[0],
  })

  const calculateSiteReduction = (population: number, percentageReduction: number): number => {
    // Base lighting requirement calculation
    let baseRequirement = 0
    if (population >= 1000 && population <= 500000) {
      baseRequirement = Math.ceil(population / 15000)
    } else if (population > 500000) {
      baseRequirement = 34 + Math.ceil((population - 500000) / 50000)
    }

    return Math.floor(baseRequirement * (percentageReduction / 100))
  }

  const handleCreateOffset = () => {
    const municipality = safeMunicipalities.find((m) => m.name === newOffset.municipality)
    if (!municipality) return

    const sitesReduced = calculateSiteReduction(municipality.population, newOffset.percentage_reduction)

    const offset: DirectServiceOffset = {
      id: offsets.length > 0 ? Math.max(...offsets.map((o) => o.id)) + 1 : 1,
      municipality: newOffset.municipality,
      census_subdivision: newOffset.census_subdivision,
      annual_volume: newOffset.annual_volume,
      percentage_reduction: newOffset.percentage_reduction,
      sites_reduced: sitesReduced,
      geographic_allocation: newOffset.geographic_allocation,
      effective_date: newOffset.effective_date,
      status: "active",
    }

    setOffsets([...offsets, offset])
    setNewOffset({
      municipality: "",
      census_subdivision: "",
      annual_volume: 0,
      percentage_reduction: 0,
      geographic_allocation: [],
      effective_date: new Date().toISOString().split("T")[0],
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Direct Service Program Offset (Lighting Only)
          </CardTitle>
          <CardDescription>Manage annual percentage-based reductions for direct pickup programs</CardDescription>
        </CardHeader>
      </Card>

      {/* Create New Offset */}
      <Card>
        <CardHeader>
          <CardTitle>Create Direct Service Offset</CardTitle>
          <CardDescription>Configure percentage reduction based on direct pickup volume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="municipality">Municipality</Label>
              <Select
                value={newOffset.municipality}
                onValueChange={(value) => {
                  const municipality = safeMunicipalities.find((m) => m.name === value)
                  setNewOffset({
                    ...newOffset,
                    municipality: value,
                    census_subdivision: municipality?.name || "",
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select municipality" />
                </SelectTrigger>
                <SelectContent>
                  {safeMunicipalities.map((municipality) => (
                    <SelectItem key={municipality.id} value={municipality.name}>
                      {municipality.name} (Pop: {municipality.population.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual-volume">Annual Volume (kg)</Label>
              <Input
                id="annual-volume"
                type="number"
                value={newOffset.annual_volume}
                onChange={(e) => setNewOffset({ ...newOffset, annual_volume: Number.parseInt(e.target.value) || 0 })}
                placeholder="Enter annual pickup volume"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="percentage-reduction">Percentage Reduction (%)</Label>
              <Input
                id="percentage-reduction"
                type="number"
                min="0"
                max="100"
                value={newOffset.percentage_reduction}
                onChange={(e) =>
                  setNewOffset({ ...newOffset, percentage_reduction: Number.parseInt(e.target.value) || 0 })
                }
                placeholder="Enter percentage reduction"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective-date">Effective Date</Label>
              <Input
                id="effective-date"
                type="date"
                value={newOffset.effective_date}
                onChange={(e) => setNewOffset({ ...newOffset, effective_date: e.target.value })}
              />
            </div>
          </div>

          {newOffset.municipality && newOffset.percentage_reduction > 0 && (
            <Alert>
              <Calculator className="h-4 w-4" />
              <AlertDescription>
                <strong>Impact Preview:</strong> This offset will reduce the lighting site requirement by{" "}
                {calculateSiteReduction(
                  safeMunicipalities.find((m) => m.name === newOffset.municipality)?.population || 0,
                  newOffset.percentage_reduction,
                )}{" "}
                sites for {newOffset.municipality}.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCreateOffset}
            disabled={!newOffset.municipality || newOffset.percentage_reduction === 0}
          >
            Create Direct Service Offset
          </Button>
        </CardContent>
      </Card>

      {/* Active Offsets */}
      <Card>
        <CardHeader>
          <CardTitle>Active Direct Service Offsets</CardTitle>
          <CardDescription>Current percentage-based reductions for lighting program requirements</CardDescription>
        </CardHeader>
        <CardContent>
          {offsets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No direct service offsets configured</p>
              <p className="text-sm">Create an offset to reduce lighting site requirements</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Municipality</TableHead>
                  <TableHead>Census Subdivision</TableHead>
                  <TableHead>Annual Volume</TableHead>
                  <TableHead>Reduction %</TableHead>
                  <TableHead>Sites Reduced</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offsets.map((offset) => (
                  <TableRow key={offset.id}>
                    <TableCell className="font-medium">{offset.municipality}</TableCell>
                    <TableCell>{offset.census_subdivision}</TableCell>
                    <TableCell>{offset.annual_volume.toLocaleString()} kg</TableCell>
                    <TableCell>{offset.percentage_reduction}%</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        -{offset.sites_reduced} sites
                      </Badge>
                    </TableCell>
                    <TableCell>{offset.effective_date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(offset.status)}>
                        {offset.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Geographic Allocation */}
      {offsets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Strategic Geographic Allocation
            </CardTitle>
            <CardDescription>Distribute site reductions across strategic locations</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Direct service offsets should be strategically allocated to areas with highest pickup density to
                maximize program effectiveness while maintaining regulatory compliance.
              </AlertDescription>
            </Alert>

            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Allocation Guidelines:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Prioritize high-density urban areas with established pickup routes</li>
                <li>• Maintain minimum coverage in rural and remote areas</li>
                <li>• Consider transportation logistics and service efficiency</li>
                <li>• Ensure equitable access across census subdivisions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
