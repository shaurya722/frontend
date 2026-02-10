"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Search, Edit, Trash2, Upload, CheckCircle, AlertTriangle, Plus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import type { Municipality } from "@/lib/supabase"
import { getMunicipalities } from "@/lib/sites"
import * as api from "@/lib/api"
import { bulkImportMunicipalities } from "@/lib/api"

interface UserData {
    username: string
    name: string
    role: string
}

export default function CommunitiesManagement() {
    const [communitiesData, setCommunitiesData] = useState<{
        count: number
        next: string | null
        previous: string | null
        results: Municipality[]
    }>({ count: 0, next: null, previous: null, results: [] })
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [tierFilter, setTierFilter] = useState<string>("all")
    const [regionFilter, setRegionFilter] = useState<string>("all")
    const [censusYearFilter, setCensusYearFilter] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [ordering, setOrdering] = useState("name")
    const [editingCommunity, setEditingCommunity] = useState<Municipality | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [communityToDelete, setCommunityToDelete] = useState<Municipality | null>(null)
    const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [bulkImportResult, setBulkImportResult] = useState<any>(null)
    const [currentUser, setCurrentUser] = useState<UserData | null>(null)
    const [editForm, setEditForm] = useState({
        name: "",
        population: 0,
        tier: "Single" as "Single" | "Lower" | "Upper",
        region: "",
        province: "Ontario",
        census_year: 2021,
    })
    const [newCommunityForm, setNewCommunityForm] = useState({
        name: "",
        population: 0,
        tier: "Single" as "Single" | "Lower" | "Upper",
        region: "",
        province: "Ontario",
        census_year: 2021,
    })
    const [successMessage, setSuccessMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    
    const isAdmin = currentUser?.role === "Administrator"

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(1) // Reset to first page on search
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch data from backend API
    const fetchCommunities = useCallback(async () => {
        setLoading(true)
        try {
            const filters: any = {
                search: debouncedSearch || undefined,
                tier: tierFilter !== "all" ? tierFilter : undefined,
                region: regionFilter !== "all" ? regionFilter : undefined,
                census_year: censusYearFilter !== "all" ? censusYearFilter : undefined,
                ordering,
                page,
                page_size: pageSize,
            }
            const data = await getMunicipalities(filters)
            setCommunitiesData({
                count: data.count,
                next: data.next,
                previous: data.previous,
                results: data.results.map((apiMunicipality) => ({
                    id: apiMunicipality.id,
                    name: apiMunicipality.name,
                    population: apiMunicipality.population,
                    tier: apiMunicipality.tier,
                    region: apiMunicipality.region,
                    province: apiMunicipality.province,
                    census_year: apiMunicipality.census_year,
                    created_at: apiMunicipality.created_at,
                    updated_at: apiMunicipality.updated_at,
                }))
            })
            setTotalPages(Math.ceil(data.count / pageSize))
            setTotalCount(data.count)
        } catch (error) {
            console.error("Error fetching communities:", error)
            setErrorMessage("Failed to fetch communities")
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, tierFilter, regionFilter, censusYearFilter, ordering, page, pageSize])

    const handleSort = (field: string) => {
        if (ordering === field) {
            setOrdering(`-${field}`)
        } else {
            setOrdering(field)
        }
    }

    useEffect(() => {
        // Get current user from localStorage
        const userData = localStorage.getItem("user")
        if (userData) {
            setCurrentUser(JSON.parse(userData))
        }
        fetchCommunities()
    }, [])

    // Refetch when filters or sort change
    useEffect(() => {
        fetchCommunities()
    }, [tierFilter, regionFilter, censusYearFilter, ordering, page, pageSize, debouncedSearch])

    // Show success/error messages temporarily
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(""), 3000)
            return () => clearTimeout(timer)
        }
    }, [successMessage])

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(""), 5000)
            return () => clearTimeout(timer)
        }
    }, [errorMessage])

    const handleEditCommunity = (community: Municipality) => {
        setEditingCommunity(community)
        setEditForm({
            name: community.name,
            population: community.population,
            tier: community.tier,
            region: community.region,
            province: community.province || "Ontario",
            census_year: community.census_year || 2021,
        })
    }

    const handleSaveEdit = async () => {
        if (!editingCommunity) return

        try {
            const response = await api.updateMunicipality(editingCommunity.id, {
                name: editForm.name,
                population: editForm.population,
                tier: editForm.tier,
                region: editForm.region,
                province: editForm.province,
                census_year: editForm.census_year,
            })

            if (response.error) throw new Error(response.error)

            // Update local state
            const updatedCommunity: Municipality = {
                ...editingCommunity,
                name: editForm.name,
                population: editForm.population,
                tier: editForm.tier,
                region: editForm.region,
                province: editForm.province,
                census_year: editForm.census_year,
                updated_at: new Date().toISOString(),
            }
            // Instead of local update, refetch to handle pagination
            await fetchCommunities()
            setEditingCommunity(null)
            setSuccessMessage(`Community "${editForm.name}" updated successfully`)
        } catch (error: any) {
            console.error("Error updating community:", error)
            setErrorMessage(error?.message || "Failed to update community")
        }
    }

    const handleDeleteCommunity = (community: Municipality) => {
        setCommunityToDelete(community)
        setIsDeleteDialogOpen(true)
    }

    const confirmDeleteCommunity = async () => {
        if (!communityToDelete) return

        try {
            const response = await api.deleteMunicipality(communityToDelete.id)
            if (response.error) throw new Error(response.error)

            // Refetch to handle pagination
            await fetchCommunities()
            setSuccessMessage(`Community "${communityToDelete.name}" deleted successfully`)
        } catch (error: any) {
            console.error("Error deleting community:", error)
            setErrorMessage(error?.message || "Failed to delete community. It may be referenced by collection sites.")
        } finally {
            setIsDeleteDialogOpen(false)
            setCommunityToDelete(null)
        }
    }

    const handleBulkImport = async () => {
        if (!selectedFile) {
            setErrorMessage("Please select a CSV file")
            return
        }

        try {
            const response = await bulkImportMunicipalities(selectedFile)
            if (response.error) {
                setErrorMessage(response.error)
                return
            }

            setBulkImportResult(response.data)
            setIsBulkImportDialogOpen(false)
            setSelectedFile(null)

            // Refresh the data to show new municipalities
            await fetchCommunities()

            if (response.data.success) {
                setSuccessMessage(`Successfully imported ${response.data.created} municipalities. ${response.data.duplicates} duplicates skipped.`)
            }
        } catch (error: any) {
            console.error("Error bulk importing:", error)
            setErrorMessage(error?.message || "Failed to import municipalities")
        }
    }

    const handleAddCommunity = async () => {
        if (!newCommunityForm.name.trim()) {
            setErrorMessage("Community name is required")
            return
        }

        try {
            const response = await api.createMunicipality({
                name: newCommunityForm.name,
                population: newCommunityForm.population,
                tier: newCommunityForm.tier,
                region: newCommunityForm.region,
                province: newCommunityForm.province,
                census_year: newCommunityForm.census_year,
            })

            if (response.error) throw new Error(response.error)

            const data: Municipality = {
                id: response.data?.id || crypto.randomUUID(),
                name: newCommunityForm.name,
                population: newCommunityForm.population,
                tier: newCommunityForm.tier,
                region: newCommunityForm.region,
                province: newCommunityForm.province,
                census_year: newCommunityForm.census_year,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            // Instead of local update, refetch to handle pagination
            await fetchCommunities()
            setIsAddDialogOpen(false)
            setNewCommunityForm({
                name: "",
                population: 0,
                tier: "Single",
                region: "",
                province: "Ontario",
                census_year: 2021,
            })
            setSuccessMessage(`Community "${newCommunityForm.name}" added successfully`)
        } catch (error: any) {
            console.error("Error adding community:", error)
            setErrorMessage(error?.message || "Failed to add community")
        }
    }

    // Get unique values for filters
    const uniqueTiers = Array.from(new Set(communitiesData.results.map((c) => c.tier))).sort()
    const uniqueRegions = Array.from(new Set(communitiesData.results.map((c) => c.region).filter(Boolean))).sort()
    const uniqueCensusYears = Array.from(
        new Set(communitiesData.results.map((c) => c.census_year || 2021).filter(Boolean)),
    ).sort((a, b) => b - a)

    const getTierBadge = (tier: string) => {
        const colors: Record<string, string> = {
            Single: "bg-blue-100 text-blue-800",
            Lower: "bg-green-100 text-green-800",
            Upper: "bg-purple-100 text-purple-800",
        }
        return colors[tier] || "bg-gray-100 text-gray-800"
    }

    const getSortIcon = (field: string) => {
        if (ordering === field) return "↑"
        if (ordering === `-${field}`) return "↓"
        return ""
    }

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {successMessage && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                </Alert>
            )}

            {errorMessage && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by community name or region..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">Tier</Label>
                            <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueTiers.map((tier) => (
                                        <SelectItem key={tier} value={tier}>
                                            {tier} Tier
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">Region</Label>
                            <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueRegions.map((region) => (
                                        <SelectItem key={region} value={region}>
                                            {region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">Census Year</Label>
                            <Select value={censusYearFilter} onValueChange={(v) => { setCensusYearFilter(v); setPage(1); }}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {uniqueCensusYears.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Communities Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Communities</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsBulkImportDialogOpen(true)}>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Census Data
                            </Button>
                            {/* <Button variant="outline" size="sm">
                                <Upload className="w-4 h-4 mr-2" />
                                Import Census Data
                            </Button> */}
                            {isAdmin && (
                                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Community
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 text-sm text-muted-foreground">
                        Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, communitiesData.count)} of {communitiesData.count} communities
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead 
                                    className="cursor-pointer hover:bg-muted/50 bg-gray-50"
                                    onClick={() => handleSort("name")}
                                >
                                    <div className="flex items-center gap-1">
                                        Community Name
                                        <ArrowUpDown className="h-3 w-3" />
                                        <span className="text-xs">{getSortIcon("name")}</span>
                                    </div>
                                </TableHead>
                                <TableHead 
                                    className="cursor-pointer hover:bg-muted/50 bg-gray-50"
                                    onClick={() => handleSort("population")}
                                >
                                    <div className="flex items-center gap-1">
                                        Population
                                        <ArrowUpDown className="h-3 w-3" />
                                        <span className="text-xs">{getSortIcon("population")}</span>
                                    </div>
                                </TableHead>
                                <TableHead 
                                    className="cursor-pointer hover:bg-muted/50 bg-gray-50"
                                    onClick={() => handleSort("tier")}
                                >
                                    <div className="flex items-center gap-1">
                                        Tier
                                        <ArrowUpDown className="h-3 w-3" />
                                        <span className="text-xs">{getSortIcon("tier")}</span>
                                    </div>
                                </TableHead>
                                <TableHead 
                                    className="cursor-pointer hover:bg-muted/50 bg-gray-50"
                                    onClick={() => handleSort("region")}
                                >
                                    <div className="flex items-center gap-1">
                                        Region/District
                                        <ArrowUpDown className="h-3 w-3" />
                                        <span className="text-xs">{getSortIcon("region")}</span>
                                    </div>
                                </TableHead>
                                <TableHead 
                                    className="cursor-pointer hover:bg-muted/50 bg-gray-50"
                                    onClick={() => handleSort("census_year")}
                                >
                                    <div className="flex items-center gap-1">
                                        Census Year
                                        <ArrowUpDown className="h-3 w-3" />
                                        <span className="text-xs">{getSortIcon("census_year")}</span>
                                    </div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        Loading communities...
                                    </TableCell>
                                </TableRow>
                            ) : communitiesData.results.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        No communities found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                communitiesData.results.map((community) => (
                                    <TableRow key={community.id}>
                                        <TableCell className="font-medium">{community.name}</TableCell>
                                        <TableCell>{community.population.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getTierBadge(community.tier)}>
                                                {community.tier} Tier
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{community.region || "-"}</TableCell>
                                        <TableCell>{community.census_year || 2021}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditCommunity(community)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteCommunity(community)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
                            <div className="text-sm text-muted-foreground">
                                Page {page} of {totalPages} ({totalCount} total)
                            </div>
                                           {/* Page Size */}
                        <div className="flex items-center gap-2">
                            <Label className="text-sm whitespace-nowrap">Per Page</Label>
                            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(1)}
                                    disabled={page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <ChevronLeft className="h-4 w-4 -ml-2" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                
                                {/* Page Numbers */}
                                {(() => {
                                    const pages: number[] = []
                                    const currentPage = page
                                    
                                    let startPage = Math.max(1, currentPage - 2)
                                    let endPage = Math.min(totalPages, currentPage + 2)
                                    
                                    if (currentPage <= 3) {
                                        endPage = Math.min(5, totalPages)
                                    }
                                    if (currentPage >= totalPages - 2) {
                                        startPage = Math.max(1, totalPages - 4)
                                    }
                                    
                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(i)
                                    }
                                    
                                    return pages.map((p) => (
                                        <Button
                                            key={p}
                                            variant={p === currentPage ? "default" : "outline"}
                                            size="sm"
                                            className="w-9"
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </Button>
                                    ))
                                })()}
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(totalPages)}
                                    disabled={page >= totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                    <ChevronRight className="h-4 w-4 -ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingCommunity} onOpenChange={(open) => !open && setEditingCommunity(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Community</DialogTitle>
                        <DialogDescription>Update community information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Community Name *</Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="e.g., Toronto, Mississauga"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Population *</Label>
                                <Input
                                    type="number"
                                    value={editForm.population}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, population: Number.parseInt(e.target.value) || 0 })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Census Year *</Label>
                                <Select
                                    value={editForm.census_year.toString()}
                                    onValueChange={(v) => setEditForm({ ...editForm, census_year: Number.parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2021">2021</SelectItem>
                                        <SelectItem value="2016">2016</SelectItem>
                                        <SelectItem value="2011">2011</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tier *</Label>
                                <Select
                                    value={editForm.tier}
                                    onValueChange={(v: "Single" | "Lower" | "Upper") => setEditForm({ ...editForm, tier: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Single">Single Tier</SelectItem>
                                        <SelectItem value="Lower">Lower Tier</SelectItem>
                                        <SelectItem value="Upper">Upper Tier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Region/District *</Label>
                                <Input
                                    value={editForm.region}
                                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                                    placeholder="e.g., Durham Region"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCommunity(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Community Dialog - Admin Only */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Community</DialogTitle>
                        <DialogDescription>Enter the details for the new community</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Community Name *</Label>
                            <Input
                                value={newCommunityForm.name}
                                onChange={(e) => setNewCommunityForm({ ...newCommunityForm, name: e.target.value })}
                                placeholder="e.g., Toronto, Mississauga"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Population *</Label>
                                <Input
                                    type="number"
                                    value={newCommunityForm.population}
                                    onChange={(e) =>
                                        setNewCommunityForm({ ...newCommunityForm, population: Number.parseInt(e.target.value) || 0 })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Census Year *</Label>
                                <Select
                                    value={newCommunityForm.census_year.toString()}
                                    onValueChange={(v) => setNewCommunityForm({ ...newCommunityForm, census_year: Number.parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2021">2021</SelectItem>
                                        <SelectItem value="2016">2016</SelectItem>
                                        <SelectItem value="2011">2011</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tier *</Label>
                                <Select
                                    value={newCommunityForm.tier}
                                    onValueChange={(v: "Single" | "Lower" | "Upper") => setNewCommunityForm({ ...newCommunityForm, tier: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Single">Single Tier</SelectItem>
                                        <SelectItem value="Lower">Lower Tier</SelectItem>
                                        <SelectItem value="Upper">Upper Tier</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Region/District *</Label>
                                <Input
                                    value={newCommunityForm.region}
                                    onChange={(e) => setNewCommunityForm({ ...newCommunityForm, region: e.target.value })}
                                    placeholder="e.g., Durham Region"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddCommunity}>Add Community</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Community</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{communityToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setCommunityToDelete(null); }}>
                            Cancel
                        </Button>
                        <Button variant="outline" className="bg-black text-white" onClick={confirmDeleteCommunity}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Import Municipalities</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file to bulk import municipalities. The CSV should have headers: name (required), population (required), tier (Single/Lower/Upper), region, province, census_year.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="csv-file">Select CSV File</Label>
                            <Input
                                id="csv-file"
                                type="file"
                                accept=".csv"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    setSelectedFile(file || null)
                                }}
                            />
                            {selectedFile && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {selectedFile.name}
                                </p>
                            )}
                        </div>
                        {bulkImportResult && (
                            <div className="space-y-2">
                                <Label>Import Results</Label>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm">
                                        <strong>Created:</strong> {bulkImportResult.created} municipalities
                                    </p>
                                    <p className="text-sm">
                                        <strong>Duplicates:</strong> {bulkImportResult.duplicates} skipped
                                    </p>
                                    {bulkImportResult.errors && bulkImportResult.errors.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-red-600">Errors:</p>
                                            <ul className="text-sm text-red-600 list-disc list-inside">
                                                {bulkImportResult.errors.map((error: string, index: number) => (
                                                    <li key={index}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsBulkImportDialogOpen(false); setSelectedFile(null); setBulkImportResult(null); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkImport} disabled={!selectedFile}>
                            Import
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
