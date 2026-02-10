"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, AlertTriangle, CheckCircle, Shuffle, Undo } from "lucide-react"
import type { CollectionSite, Municipality } from "@/lib/supabase"

interface Reallocation {
  id: string
  siteId: string | number
  siteName: string
  fromMunicipality: string
  toMunicipality: string
  program: string
  type: "site" | "event" | "direct_return"
  percentage: number
  rationale: string
  status: "pending" | "approved" | "rejected"
  validationErrors: string[]
}

interface ReallocationToolsProps {
  sites?: CollectionSite[]
  municipalities?: Municipality[]
}

export default function ReallocationTools({ sites = [], municipalities = [] }: ReallocationToolsProps) {
  const [reallocations, setReallocations] = useState<Reallocation[]>([])
  const [isReallocationDialogOpen, setIsReallocationDialogOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<CollectionSite | null>(null)
  const [newReallocation, setNewReallocation] = useState({
    toMunicipality: "",
    program: "",
    type: "site" as "site" | "event" | "direct_return",
    percentage: 100,
    rationale: "",
  })

  const safeSites = sites || []
  
  // Deduplicate municipalities by name (global dataset - one per community)
  // Use useMemo to prevent infinite loops
  const safeMunicipalities = useMemo(() => {
    if (!municipalities) return []
    const uniqueMap = new Map<string, Municipality>()
    for (const municipality of municipalities) {
      const key = municipality.name.toLowerCase().trim()
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, municipality)
      }
    }
    return Array.from(uniqueMap.values())
  }, [municipalities])

  // Mock adjacent municipalities (in real implementation, this would come from GIS data)
  const getAdjacentMunicipalities = (municipality: string) => {
    const adjacencyMap: { [key: string]: string[] } = {
      Toronto: ["Pickering", "Richmond Hill", "Mississauga", "Vaughan"],
      Mississauga: ["Toronto", "Brampton", "Oakville"],
      Hamilton: ["Toronto", "Burlington"],
      Ottawa: ["Gatineau", "Kanata"],
      London: ["Kitchener", "Woodstock"],
      Kitchener: ["London", "Vaughan", "Guelph"],
      Windsor: ["London", "Tecumseh"],
      Vaughan: ["Toronto", "Markham", "Richmond Hill"],
      Markham: ["Toronto", "Vaughan", "Pickering"],
      Brampton: ["Mississauga", "Vaughan", "Caledon"],
    }
    return adjacencyMap[municipality] || []
  }

  // Mock adjacent communities function
  const getAdjacentCommunities = (municipality: string) => {
    return getAdjacentMunicipalities(municipality)
  }

  // Update reallocation logic with proper business rules
  const validateReallocation = (reallocation: Partial<Reallocation>, site: CollectionSite): string[] => {
    const errors: string[] = []

    if (!reallocation.toMunicipality) {
      errors.push("Destination municipality is required")
      return errors
    }

    if (site.site_type === "Municipal Depot" || site.site_type === "Seasonal Depot") {
      errors.push("Municipal and Seasonal Depots cannot be reallocated due to residency restrictions")
      return errors
    }

    if (site.site_type === "Event") {
      errors.push("Events cannot be reassigned geographically")
      return errors
    }

    if (site.site_type === "Return to Retail") {
      const adjacentCommunities = getAdjacentCommunities(site.municipality?.name || "")
      if (!adjacentCommunities.includes(reallocation.toMunicipality)) {
        errors.push("Return-to-retail sites can only be reallocated to adjacent communities")
      }
    }

    const program = reallocation.program || ""

    if (program === "Lighting") {
      const adjacentMunicipalities = getAdjacentMunicipalities(site.municipality?.name || "")
      if (!adjacentMunicipalities.includes(reallocation.toMunicipality)) {
        errors.push("EEE (Lighting) sites can only be reallocated to adjacent municipalities")
      }
    } else if (["Paint", "Solvents", "Pesticides"].includes(program)) {
      const adjacentMunicipalities = getAdjacentMunicipalities(site.municipality?.name || "")
      const fromMunicipalityData = safeMunicipalities.find((m) => m.name === site.municipality?.name)
      const toMunicipalityData = safeMunicipalities.find((m) => m.name === reallocation.toMunicipality)

      const isAdjacent = adjacentMunicipalities.includes(reallocation.toMunicipality)
      const isSameUpperTier = fromMunicipalityData?.region === toMunicipalityData?.region

      if (!isAdjacent && !isSameUpperTier) {
        errors.push("HSP sites can only be reallocated to adjacent municipalities or within the same upper-tier")
      }
    }

    if (reallocation.type === "event" && (reallocation.percentage || 0) > 35) {
      errors.push("Events can offset maximum 35% of required sites")
    }

    if (reallocation.type === "site" && (reallocation.percentage || 0) > 10) {
      errors.push("Adjacent community sharing limited to 10% of required sites")
    }

    return errors
  }

  const handleCreateReallocation = () => {
    if (!selectedSite) return

    const validationErrors = validateReallocation(newReallocation, selectedSite)

    const reallocation: Reallocation = {
      id: crypto.randomUUID(),
      siteId: selectedSite.id,
      siteName: selectedSite.name,
      fromMunicipality: selectedSite.municipality?.name || "",
      toMunicipality: newReallocation.toMunicipality,
      program: newReallocation.program,
      type: newReallocation.type,
      percentage: newReallocation.percentage,
      rationale: newReallocation.rationale,
      status: validationErrors.length > 0 ? "rejected" : "pending",
      validationErrors,
    }

    setReallocations([...reallocations, reallocation])
    setIsReallocationDialogOpen(false)
    setSelectedSite(null)
    setNewReallocation({
      toMunicipality: "",
      program: "",
      type: "site",
      percentage: 100,
      rationale: "",
    })
  }

  const handleApproveReallocation = (id: string) => {
    setReallocations(reallocations.map((r) => (r.id === id ? { ...r, status: "approved" as const } : r)))
  }

  const handleRejectReallocation = (id: string) => {
    setReallocations(reallocations.map((r) => (r.id === id ? { ...r, status: "rejected" as const } : r)))
  }

  const handleDeleteReallocation = (id: string) => {
    setReallocations(reallocations.filter((r) => r.id !== id))
  }

  const handleAutoAssignment = () => {
    // Priority 1: Assign permanent locations (Municipal Depots, Return to Retail)
    // Priority 2: Use events for remaining shortfalls
    console.log("Running auto-assignment logic...")
    alert("Auto-assignment would prioritize permanent locations, then events for shortfalls")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "site":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "event":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "direct_return":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleSiteSelect = (siteId: string) => {
    const site = safeSites.find((s) => s.id === siteId)
    setSelectedSite(site || null)
    if (site && site.programs && site.programs.length > 0) {
      setNewReallocation({ ...newReallocation, program: site.programs[0] })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Site Reallocation Tools</CardTitle>
              <CardDescription>Reassign sites across communities within regulatory constraints</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoAssignment}>
                <Shuffle className="w-4 h-4 mr-2" />
                Auto-Assignment Logic
              </Button>
              <Dialog open={isReallocationDialogOpen} onOpenChange={setIsReallocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    New Reallocation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Site Reallocation</DialogTitle>
                    <DialogDescription>Reassign a site or event to another municipality</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="site">Select Site</Label>
                        <Select value={selectedSite?.id.toString() || ""} onValueChange={handleSiteSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select site to reallocate" />
                          </SelectTrigger>
                          <SelectContent>
                            {safeSites.map((site) => (
                              <SelectItem key={site.id} value={site.id.toString()}>
                                {site.name} ({site.municipality?.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="program">Program</Label>
                        <Select
                          value={newReallocation.program}
                          onValueChange={(value) => setNewReallocation({ ...newReallocation, program: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedSite?.programs.map((program) => (
                              <SelectItem key={program} value={program}>
                                {program}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="to-municipality">Destination Municipality</Label>
                        <Select
                          value={newReallocation.toMunicipality}
                          onValueChange={(value) => setNewReallocation({ ...newReallocation, toMunicipality: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                          <SelectContent>
                            {safeMunicipalities
                              .filter((m) => (selectedSite ? m.name !== selectedSite.municipality?.name : true))
                              .map((municipality) => (
                                <SelectItem key={municipality.id} value={municipality.name}>
                                  {municipality.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type">Reallocation Type</Label>
                        <Select
                          value={newReallocation.type}
                          onValueChange={(value: "site" | "event" | "direct_return") =>
                            setNewReallocation({ ...newReallocation, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="site">Site Reallocation</SelectItem>
                            <SelectItem value="event">Event Offset</SelectItem>
                            <SelectItem value="direct_return">Direct Return Program</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="percentage">
                        Percentage ({newReallocation.type === "event" ? "max 35%" : "max 10%"})
                      </Label>
                      <Input
                        id="percentage"
                        type="number"
                        min="1"
                        max={newReallocation.type === "event" ? "35" : "10"}
                        value={newReallocation.percentage}
                        onChange={(e) =>
                          setNewReallocation({ ...newReallocation, percentage: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="Enter percentage"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rationale">Rationale</Label>
                      <Textarea
                        id="rationale"
                        value={newReallocation.rationale}
                        onChange={(e) => setNewReallocation({ ...newReallocation, rationale: e.target.value })}
                        placeholder="Provide justification for this reallocation"
                        rows={3}
                      />
                    </div>

                    {selectedSite && newReallocation.toMunicipality && newReallocation.program && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Validation Preview:</strong>
                          {validateReallocation(newReallocation, selectedSite).length === 0 ? (
                            <span className="text-green-600"> This reallocation appears valid.</span>
                          ) : (
                            <div className="text-red-600">
                              <div>Issues found:</div>
                              <ul className="list-disc list-inside mt-1">
                                {validateReallocation(newReallocation, selectedSite).map((error, index) => (
                                  <li key={index} className="text-sm">
                                    {error}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsReallocationDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateReallocation} disabled={!selectedSite}>
                      Create Reallocation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Reallocations */}
      <Card>
        <CardHeader>
          <CardTitle>Active Reallocations ({reallocations.length})</CardTitle>
          <CardDescription>Manage site reassignments and validate regulatory compliance</CardDescription>
        </CardHeader>
        <CardContent>
          {reallocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shuffle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reallocations created yet</p>
              <p className="text-sm">Create a new reallocation to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reallocations.map((reallocation) => (
                  <TableRow key={reallocation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reallocation.siteName}</div>
                        {reallocation.rationale && (
                          <div className="text-sm text-gray-600 mt-1">{reallocation.rationale}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{reallocation.fromMunicipality}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{reallocation.toMunicipality}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{reallocation.program}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(reallocation.type)}>
                        {reallocation.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{reallocation.percentage}%</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className={getStatusColor(reallocation.status)}>
                          {reallocation.status}
                        </Badge>
                        {reallocation.validationErrors.length > 0 && (
                          <div className="text-xs text-red-600">
                            {reallocation.validationErrors.length} validation error(s)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {reallocation.status === "pending" && reallocation.validationErrors.length === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproveReallocation(reallocation.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {reallocation.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectReallocation(reallocation.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReallocation(reallocation.id)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Undo className="w-4 h-4" />
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

      {/* Reallocation Summary */}
      {reallocations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <div className="h-4 w-4 bg-yellow-400 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reallocations.filter((r) => r.status === "pending").length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reallocations.filter((r) => r.status === "approved").length}
              </div>
              <p className="text-xs text-muted-foreground">Active reallocations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {reallocations.filter((r) => r.status === "rejected").length}
              </div>
              <p className="text-xs text-muted-foreground">Validation failed</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
