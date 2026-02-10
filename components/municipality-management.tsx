"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Upload, Download, MapPin, Users, CheckCircle } from "lucide-react"

interface Municipality {
  id: string
  name: string
  population: number
  tier: "Single" | "Lower" | "Upper"
  region: string
  province: string
  created_at: string
  updated_at: string
}

interface MunicipalityManagementProps {
  municipalities?: Municipality[]
  setMunicipalities?: (municipalities: Municipality[]) => void
}

export default function MunicipalityManagement({
  municipalities = [],
  setMunicipalities,
}: MunicipalityManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingMunicipality, setEditingMunicipality] = useState<Municipality | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTier, setFilterTier] = useState("all")
  const [filterRegion, setFilterRegion] = useState("all")
  const [newMunicipality, setNewMunicipality] = useState({
    name: "",
    population: 0,
    tier: "Single" as "Single" | "Lower" | "Upper",
    region: "",
    province: "Ontario",
  })
  const [importResults, setImportResults] = useState<{
    success: number
    errors: number
    warnings: string[]
  } | null>(null)

  const safeMunicipalities = Array.isArray(municipalities) ? municipalities : []

  const tiers = ["Single", "Lower", "Upper"]
  const regions = [
    "GTA",
    "Peel",
    "York",
    "Durham",
    "Halton",
    "Hamilton",
    "Waterloo",
    "Ottawa",
    "London",
    "Windsor-Essex",
    "Niagara",
    "Simcoe",
    "Muskoka",
    "Kawartha Lakes",
    "Haliburton",
    "Northumberland",
    "Hastings",
    "Renfrew",
  ]

  const handleAddMunicipality = () => {
    if (!setMunicipalities) return

    const municipality: Municipality = {
      id: crypto.randomUUID(),
      ...newMunicipality,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setMunicipalities([...safeMunicipalities, municipality])
    setNewMunicipality({
      name: "",
      population: 0,
      tier: "Single",
      region: "",
      province: "Ontario",
    })
    setIsAddDialogOpen(false)
  }

  const handleEditMunicipality = (municipality: Municipality) => {
    setEditingMunicipality(municipality)
    setNewMunicipality({
      name: municipality.name,
      population: municipality.population,
      tier: municipality.tier,
      region: municipality.region,
      province: municipality.province,
    })
  }

  const handleUpdateMunicipality = () => {
    if (editingMunicipality && setMunicipalities) {
      setMunicipalities(
        safeMunicipalities.map((m) =>
          m.id === editingMunicipality.id
            ? {
                ...newMunicipality,
                id: editingMunicipality.id,
                created_at: editingMunicipality.created_at,
                updated_at: new Date().toISOString(),
              }
            : m,
        ),
      )
      setEditingMunicipality(null)
      setNewMunicipality({
        name: "",
        population: 0,
        tier: "Single",
        region: "",
        province: "Ontario",
      })
    }
  }

  const handleDeleteMunicipality = (id: string) => {
    if (!setMunicipalities) return

    if (confirm("Are you sure you want to delete this municipality? This action cannot be undone.")) {
      setMunicipalities(safeMunicipalities.filter((m) => m.id !== id))
    }
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Mock import process
    setTimeout(() => {
      setImportResults({
        success: 25,
        errors: 2,
        warnings: [
          "2 municipalities had invalid population data - using census estimates",
          "3 municipalities missing region data - assigned based on location",
        ],
      })
    }, 2000)
  }

  const exportMunicipalities = (format: "csv" | "excel") => {
    console.log(`Exporting municipalities as ${format}`)
    alert(`Municipality data would be exported as ${format.toUpperCase()} file`)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Single":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Lower":
        return "bg-green-100 text-green-800 border-green-200"
      case "Upper":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredMunicipalities = safeMunicipalities.filter((municipality) => {
    const matchesSearch =
      municipality.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      municipality.region.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = filterTier === "all" || municipality.tier === filterTier
    const matchesRegion = filterRegion === "all" || municipality.region === filterRegion

    return matchesSearch && matchesTier && matchesRegion
  })

  const totalPopulation = safeMunicipalities.reduce((sum, m) => sum + m.population, 0)
  const averagePopulation = safeMunicipalities.length > 0 ? Math.round(totalPopulation / safeMunicipalities.length) : 0

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-end gap-2">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImportCSV}
                className="hidden"
                id="csv-import"
              />
              <Button variant="outline" size="sm" onClick={() => document.getElementById("csv-import")?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportMunicipalities("csv")}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Municipality
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Municipality</DialogTitle>
                    <DialogDescription>Enter the details for the new municipality</DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Municipality Name</Label>
                      <Input
                        id="name"
                        value={newMunicipality.name}
                        onChange={(e) => setNewMunicipality({ ...newMunicipality, name: e.target.value })}
                        placeholder="Enter municipality name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="population">Population</Label>
                      <Input
                        id="population"
                        type="number"
                        value={newMunicipality.population}
                        onChange={(e) =>
                          setNewMunicipality({ ...newMunicipality, population: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="Enter population"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tier">Municipal Tier</Label>
                      <Select
                        value={newMunicipality.tier}
                        onValueChange={(value: "Single" | "Lower" | "Upper") =>
                          setNewMunicipality({ ...newMunicipality, tier: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiers.map((tier) => (
                            <SelectItem key={tier} value={tier}>
                              {tier} Tier
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select
                        value={newMunicipality.region}
                        onValueChange={(value) => setNewMunicipality({ ...newMunicipality, region: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        value={newMunicipality.province}
                        onChange={(e) => setNewMunicipality({ ...newMunicipality, province: e.target.value })}
                        placeholder="Province"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMunicipality}>Add Municipality</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Import Results */}
      {importResults && (
        <Alert className={importResults.errors > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
          <CheckCircle className="h-4 w-4" />
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Municipalities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMunicipalities.length}</div>
            <p className="text-xs text-muted-foreground">Across Ontario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Population</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPopulation.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined population</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Population</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePopulation.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per municipality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(safeMunicipalities.map((m) => m.region)).size}</div>
            <p className="text-xs text-muted-foreground">Administrative regions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search municipalities or regions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier-filter">Filter by Tier</Label>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger>
                  <SelectValue placeholder="All tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {tiers.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier} Tier
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region-filter">Filter by Region</Label>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Municipalities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Municipalities ({filteredMunicipalities.length})</CardTitle>
          <CardDescription>Manage municipality data and administrative boundaries</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMunicipalities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium mb-2">No municipalities found</div>
              <p className="text-sm">
                {safeMunicipalities.length === 0
                  ? "Add a new municipality to get started or import data from CSV"
                  : "Try adjusting your search or filter criteria"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Municipality</TableHead>
                  <TableHead>Population</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMunicipalities.map((municipality) => (
                  <TableRow key={municipality.id}>
                    <TableCell>
                      <div className="font-medium">{municipality.name}</div>
                    </TableCell>
                    <TableCell>{municipality.population.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTierColor(municipality.tier)}>
                        {municipality.tier} Tier
                      </Badge>
                    </TableCell>
                    <TableCell>{municipality.region}</TableCell>
                    <TableCell>{municipality.province}</TableCell>
                    <TableCell>{new Date(municipality.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditMunicipality(municipality)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMunicipality(municipality.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingMunicipality} onOpenChange={() => setEditingMunicipality(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Municipality</DialogTitle>
            <DialogDescription>Update the details for this municipality</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Municipality Name</Label>
              <Input
                id="edit-name"
                value={newMunicipality.name}
                onChange={(e) => setNewMunicipality({ ...newMunicipality, name: e.target.value })}
                placeholder="Enter municipality name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-population">Population</Label>
              <Input
                id="edit-population"
                type="number"
                value={newMunicipality.population}
                onChange={(e) =>
                  setNewMunicipality({ ...newMunicipality, population: Number.parseInt(e.target.value) || 0 })
                }
                placeholder="Enter population"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tier">Municipal Tier</Label>
              <Select
                value={newMunicipality.tier}
                onValueChange={(value: "Single" | "Lower" | "Upper") =>
                  setNewMunicipality({ ...newMunicipality, tier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier} Tier
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-region">Region</Label>
              <Select
                value={newMunicipality.region}
                onValueChange={(value) => setNewMunicipality({ ...newMunicipality, region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-province">Province</Label>
              <Input
                id="edit-province"
                value={newMunicipality.province}
                onChange={(e) => setNewMunicipality({ ...newMunicipality, province: e.target.value })}
                placeholder="Province"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMunicipality(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMunicipality}>Update Municipality</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
