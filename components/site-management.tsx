"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { bulkImportSites, exportSitesToCSV } from "@/lib/api"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Settings2, 
  RotateCcw,
  Calendar,
  CalendarDays,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import type { CollectionSite, Municipality } from "@/lib/supabase"
import { createSite, updateSite, deleteSite } from "@/lib/sites"

interface SiteManagementProps {
  sites?: CollectionSite[]
  setSites?: (sites: CollectionSite[]) => void
  municipalities?: Municipality[]
  // Pagination props
  currentPage?: number
  pageSize?: number
  totalPages?: number
  totalItems?: number
  hasNext?: boolean
  hasPrevious?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  isLoading?: boolean
  // Callback to refresh data after API operations
  onRefresh?: () => void
  // Callbacks for search, filter, and sort
  onSearchChange?: (search: string) => void
  onFilterChange?: (filters: any) => void
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void
  // Statistics from API
  statistics?: {
    total: number
    active: number
    scheduled: number
    inactive: number
    filtered: number
  }
}

interface BulkOperation {
  type: "status_change" | "program_update" | "delete"
  sites: CollectionSite[]
  newStatus?: string
  newPrograms?: string[]
}

export default function SiteManagement({ 
  sites = [], 
  setSites, 
  municipalities = [],
  currentPage = 1,
  pageSize = 10,
  totalPages = 1,
  totalItems = 0,
  hasNext = false,
  hasPrevious = false,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  onRefresh,
  onSearchChange,
  onFilterChange,
  onSortChange,
  statistics,
}: SiteManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<CollectionSite | null>(null)
  const [selectedSites, setSelectedSites] = useState<Set<string | number>>(new Set())
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [programFilter, setProgramFilter] = useState("all")
  const [municipalityFilter, setMunicipalityFilter] = useState("all")
  const [servicePartnerFilter, setServicePartnerFilter] = useState("all")
  const [siteTypeFilter, setSiteTypeFilter] = useState("all")
  const [operatorTypeFilter, setOperatorTypeFilter] = useState("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [isDraftMode, setIsDraftMode] = useState(false)
  const [draftChanges, setDraftChanges] = useState<Partial<CollectionSite>>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [siteToDelete, setSiteToDelete] = useState<CollectionSite | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [bulkImportResult, setBulkImportResult] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  
  // Column visibility state - all columns visible by default
  const [visibleColumns, setVisibleColumns] = useState({
    siteInfo: true,
    siteType: true,
    operatorType: true,
    community: true,
    programs: true,
    servicePartner: true,
    startDate: true,
    endDate: true,
    status: true,
    actions: true,
  })

  const [newSite, setNewSite] = useState({
    name: "",
    address: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    postal_code: "",
    municipality_id: "",
    programs: [] as string[],
    site_type: "",
    operator_type: "",
    service_partner: "",
    materials_collected: [] as string[],
    collection_scope: [] as string[],
    community: "",
    region_district: "",
    service_area: undefined as number | undefined,
    status: "Active" as "Active" | "Inactive" | "Scheduled" | "Pending" | "Deactivated",
    latitude: 0,
    longitude: 0,
    active_dates: "",
  })

  // Programs based on actual database values (no duplicates)
  const programs = ["Paint", "Lighting", "Solvents", "Pesticides"]

  const siteTypes = ["Collection site", "Event"]

  const operatorTypes = [
    "Retailer",
    "Distributor",
    "Municipal",
    "First Nation/Indigenous",
    "Private Depot",
    "Product Care",
    "Regional District",
    "Regional Service Commission",
    "Other",
  ]

  const materialsServices = ["Paints and Coatings", "Solvents", "Pesticides", "Lights", "Fertilizer","PaintShare"]

  const collectionSectors = ["Residential", "Commercial", "Industrial", "Institutional"]

  const onRegionsDistricts = [
    "Central Ontario",
    "Eastern Ontario",
    "Greater Toronto Area",
    "Northern Ontario",
    "Southwestern Ontario",
  ]

  const statuses = ["Active", "Scheduled", "Inactive"]

  const safeSites = Array.isArray(sites) ? sites : []
  
  // Deduplicate municipalities by name (global dataset - one per community)
  // Use useMemo to prevent infinite loops in useEffect
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

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      if (onSearchChange) {
        onSearchChange(searchTerm)
      }
    }, 300)
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, onSearchChange])

  // Show success message temporarily
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Helper function to normalize program names for filtering (handles case-insensitive and variations)
  const normalizeProgram = (program: string): string => {
    const normalized = program.toLowerCase().trim()
    // Map variations to standard names
    if (normalized.includes('light') || normalized === 'lights') return 'Lighting'
    if (normalized.includes('paint')) return 'Paint'
    if (normalized.includes('solvent')) return 'Solvents'
    if (normalized.includes('pesticide')) return 'Pesticides'
    return normalized
  }

  // Filter sites based on search and filters
  const filteredSites = safeSites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.municipality?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.service_partner?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || site.status === statusFilter

    // Improved program matching - handles case-insensitive and variations
    const matchesProgram =
      programFilter === "all" ||
      (Array.isArray(site.programs) &&
        site.programs.some(
          (p) => normalizeProgram(p) === normalizeProgram(programFilter) || p.toLowerCase() === programFilter.toLowerCase()
        ))

    const matchesMunicipality = municipalityFilter === "all" || site.municipality?.name === municipalityFilter

    const matchesServicePartner =
      servicePartnerFilter === "all" || site.service_partner === servicePartnerFilter

    const matchesSiteType = siteTypeFilter === "all" || site.site_type === siteTypeFilter

    const matchesOperatorType = operatorTypeFilter === "all" || site.operator_type === operatorTypeFilter

    const matchesDateRange =
      !dateRange.start ||
      !dateRange.end ||
      (site.active_dates && site.active_dates >= dateRange.start && site.active_dates <= dateRange.end)

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProgram &&
      matchesMunicipality &&
      matchesServicePartner &&
      matchesSiteType &&
      matchesOperatorType &&
      matchesDateRange
    )
  })

  const handleAddSite = async () => {
    if (!setSites) return

    setIsSaving(true)
    try {
      const siteData = {
        name: newSite.name,
        address: newSite.address,
        programs: newSite.programs,
        site_type: newSite.site_type,
        municipality_id: newSite.municipality_id,
        operator_type: newSite.operator_type,
        service_partner: newSite.service_partner,
        materials_collected: newSite.materials_collected,
        collection_scope: newSite.collection_scope,
        community: newSite.community,
        region_district: newSite.region_district,
        service_area: newSite.service_area,
        status: newSite.status as CollectionSite["status"],
        latitude: newSite.latitude,
        longitude: newSite.longitude,
        active_dates: newSite.active_dates,
      }

      // Call API to create site
      const createdSite = await createSite(siteData)
      
      // Update local state with the created site
      setSites([...safeSites, createdSite])
      setSuccessMessage(`Site "${createdSite.name}" added successfully`)
      resetNewSiteForm()
      setIsAddDialogOpen(false)
      
      // Refresh data from server to ensure consistency
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error adding site:", error)
      setImportErrors([`Error adding site: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setIsSaving(false)
    }
  }

  const resetNewSiteForm = () => {
    setNewSite({
      name: "",
      address: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_province: "",
      postal_code: "",
      municipality_id: "",
      programs: [],
      site_type: "",
      operator_type: "",
      materials_collected: [],
      collection_scope: [],
      service_partner: "",
      community: "",
      region_district: "",
      service_area: undefined,
      status: "Active",
      latitude: 0,
      longitude: 0,
      active_dates: "",
    })
  }

  const handleEditSite = (site: CollectionSite) => {
    setEditingSite(site)
    setNewSite({
      name: site.name,
      address: site.address,
      address_line1: site.address_line1 || "",
      address_line2: site.address_line2 || "",
      city: site.city || "",
      state_province: site.state_province || "",
      postal_code: site.postal_code || "",
      municipality_id: site.municipality_id,
      programs: site.programs || [],
      site_type: site.site_type || "",
      operator_type: site.operator_type || "",
      materials_collected: site.materials_collected || [],
      collection_scope: site.collection_scope || [],
      service_partner: site.service_partner || "",
      community: site.community || "",
      region_district: site.region_district || "",
      service_area: site.service_area,
      status: site.status,
      latitude: site.latitude || 0,
      longitude: site.longitude || 0,
      active_dates: site.active_dates || "",
    })
    setActiveTab("basic") // Reset to basic tab on edit
  }

  const handleSaveEdit = async () => {
    if (!setSites || !editingSite) return

    setIsSaving(true)
    try {
      const updates: Partial<CollectionSite> = {
        name: newSite.name,
        address: newSite.address,
        municipality_id: newSite.municipality_id,
        programs: newSite.programs,
        site_type: newSite.site_type,
        operator_type: newSite.operator_type,
        service_partner: newSite.service_partner,
        materials_collected: newSite.materials_collected,
        collection_scope: newSite.collection_scope,
        community: newSite.community,
        region_district: newSite.region_district,
        service_area: newSite.service_area,
        status: newSite.status as CollectionSite["status"],
        latitude: newSite.latitude,
        longitude: newSite.longitude,
        active_dates: newSite.active_dates,
      }

      // Call API to update site
      const updatedSite = await updateSite(editingSite.id.toString(), updates)
      
      // Update local state with the updated site
      const updatedSites = safeSites.map((site) => 
        site.id === editingSite.id ? updatedSite : site
      )
      setSites(updatedSites)
      setEditingSite(null)
      setSuccessMessage(`Site "${updatedSite.name}" updated successfully`)
      resetNewSiteForm()
      
      // Refresh data from server to ensure consistency
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error updating site:", error)
      setImportErrors([`Error updating site: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivateSite = async (id: string | number) => {
    if (!setSites) return

    if (confirm("Are you sure you want to deactivate this site? This action can be reversed.")) {
      setIsSaving(true)
      try {
        // Call API to update site status
        const updatedSite = await updateSite(id.toString(), { status: "Inactive" })
        
        // Update local state
        setSites(
          safeSites.map((s) =>
            s.id === id ? updatedSite : s
          ),
        )
        setSuccessMessage("Site deactivated successfully")
        
        // Refresh data from server
        if (onRefresh) {
          onRefresh()
        }
      } catch (error) {
        console.error("Error deactivating site:", error)
        setImportErrors([`Error deactivating site: ${error instanceof Error ? error.message : String(error)}`])
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!setSites || selectedSites.size === 0) return

    if (confirm(`Are you sure you want to change ${selectedSites.size} sites to ${newStatus}?`)) {
      setIsSaving(true)
      try {
        // Update each selected site via API
        const updatePromises = Array.from(selectedSites).map((siteId) =>
          updateSite(siteId.toString(), { status: newStatus as CollectionSite["status"] })
        )
        
        await Promise.all(updatePromises)
        
        // Update local state
        setSites(
          safeSites.map((s) =>
            selectedSites.has(s.id)
              ? {
                ...s,
                status: newStatus as CollectionSite["status"],
                updated_at: new Date().toISOString(),
              }
              : s,
          ),
        )

        setSuccessMessage(`${selectedSites.size} sites updated to ${newStatus}`)
        setSelectedSites(new Set())
        
        // Refresh data from server
        if (onRefresh) {
          onRefresh()
        }
      } catch (error) {
        console.error("Error updating sites:", error)
        setImportErrors([`Error updating sites: ${error instanceof Error ? error.message : String(error)}`])
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleDeleteSite = (site: CollectionSite) => {
    setSiteToDelete(site)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteSite = async () => {
    if (!setSites || !siteToDelete) return
    
    setIsSaving(true)
    try {
      // Call API to delete site
      await deleteSite(siteToDelete.id.toString())
      
      // Update local state
      setSites(safeSites.filter((site) => site.id !== siteToDelete.id))
      setSuccessMessage("Site deleted successfully!")
      
      // Refresh data from server
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error deleting site:", error)
      setImportErrors([`Error deleting site: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setIsSaving(false)
      setIsDeleteDialogOpen(false)
      setSiteToDelete(null)
    }
  }

  const handleBulkDelete = () => {
    if (selectedSites.size === 0) return
    setIsBulkDeleteDialogOpen(true)
  }

  const confirmBulkDelete = async () => {
    if (!setSites || selectedSites.size === 0) return

    setIsSaving(true)
    let errorCount = 0
    let successCount = 0
    
    try {
      const sitesToDelete = safeSites.filter(site => selectedSites.has(site.id))
      
      for (const site of sitesToDelete) {
        try {
          await deleteSite(site.id.toString())
          successCount++
        } catch (error) {
          errorCount++
          console.error(`Error deleting site ${site.id}:`, error)
        }
      }
      
      if (errorCount > 0) {
        setImportErrors([`Failed to delete ${errorCount} sites`])
      }
      
      if (successCount > 0) {
        const updatedSites = safeSites.filter(site => !selectedSites.has(site.id))
        setSites(updatedSites)
        setSelectedSites(new Set())
        setSuccessMessage(`Successfully deleted ${successCount} sites`)
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error("Error bulk deleting sites:", error)
      setImportErrors([`Error deleting sites: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setIsSaving(false)
      setIsBulkDeleteDialogOpen(false)
    }
  }

  const handleSiteSelect = (siteId: string | number, checked: boolean) => {
    const newSelected = new Set(selectedSites)
    if (checked) {
      newSelected.add(siteId)
    } else {
      newSelected.delete(siteId)
    }
    setSelectedSites(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSites(new Set(filteredSites.map((s) => s.id)))
    } else {
      setSelectedSites(new Set())
    }
  }

  // Build and notify filters
  const notifyFilterChange = useCallback((newFilters: any) => {
    if (onFilterChange) {
      const filters: any = {}
      if (newFilters.status && newFilters.status !== "all") filters.status = newFilters.status
      if (newFilters.site_type && newFilters.site_type !== "all") filters.site_type = newFilters.site_type
      if (newFilters.operator_type && newFilters.operator_type !== "all") filters.operator_type = newFilters.operator_type
      if (newFilters.municipality && newFilters.municipality !== "all") filters.municipality = newFilters.municipality
      if (newFilters.service_partner && newFilters.service_partner !== "all") filters.service_partner = newFilters.service_partner
      if (newFilters.program && newFilters.program !== "all") filters.programs = [newFilters.program]
      onFilterChange(filters)
    }
  }, [onFilterChange])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setProgramFilter("all")
    setMunicipalityFilter("all")
    setServicePartnerFilter("all")
    setSiteTypeFilter("all")
    setOperatorTypeFilter("all")
    setDateRange({ start: "", end: "" })
    setSuccessMessage("Filters cleared")
    // Notify parent to clear filters
    if (onFilterChange) {
      onFilterChange({})
    }
  }

  // Get unique service partners from sites
  const servicePartners = Array.from(
    new Set(safeSites.map((s) => s.service_partner).filter(Boolean))
  ).sort() as string[]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200"
      case "Scheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Deactivated":
        return "bg-red-100 text-red-800 border-red-200"
      case "Pending":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Helper to parse active_dates (could be DATERANGE format like "[2024-01-01,2025-12-31)" or single date)
  const parseDateRange = (activeDates: string | undefined): { start: string | null; end: string | null } => {
    if (!activeDates) return { start: null, end: null }
    
    // Handle DATERANGE format: [start,end) or [start,)
    const rangeMatch = activeDates.match(/\[([^,]*),([^\)]*)\)/)
    if (rangeMatch) {
      return {
        start: rangeMatch[1] || null,
        end: rangeMatch[2] || null,
      }
    }
    
    // Handle simple date string
    return { start: activeDates, end: null }
  }

  // Format date for display
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "—"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return dateStr
    }
  }

  // Toggle column visibility
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }))
  }

  // Handle sorting
  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortDirection(newDirection)
    if (onSortChange) {
      onSortChange(field, newDirection)
    }
  }

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1" /> : 
      <ArrowDown className="w-4 h-4 ml-1" />
  }

  const handleProgramChange = (program: string, checked: boolean) => {
    setNewSite((prevSite) => ({
      ...prevSite,
      programs: checked ? [...prevSite.programs, program] : prevSite.programs.filter((p) => p !== program),
    }))
  }

  const handleMaterialChange = (material: string, checked: boolean) => {
    setNewSite((prevSite) => ({
      ...prevSite,
      materials_collected: checked
        ? [...prevSite.materials_collected, material]
        : prevSite.materials_collected.filter((m) => m !== material),
    }))
  }

  const handleScopeChange = (scope: string, checked: boolean) => {
    setNewSite((prevSite) => ({
      ...prevSite,
      collection_scope: checked
        ? [...prevSite.collection_scope, scope]
        : prevSite.collection_scope.filter((s) => s !== scope),
    }))
  }

  // Stats should reflect data from API statistics
  const siteStats = statistics || {
    total: filteredSites.length,
    active: filteredSites.filter((s) => s.status === "Active").length,
    scheduled: filteredSites.filter((s) => s.status === "Scheduled").length,
    inactive: filteredSites.filter((s) => s.status === "Inactive").length,
    filtered: filteredSites.length,
  }

  const handleBulkImport = async () => {
    if (!selectedFile) {
      setImportErrors(["Please select a CSV file"])
      return
    }

    setIsSaving(true)
    try {
      const response = await bulkImportSites(selectedFile)
      if (response.error) {
        setImportErrors([response.error])
        return
      }

      setBulkImportResult(response.data)
      setIsBulkImportDialogOpen(false)
      setSelectedFile(null)

      // Refresh the data to show new sites
      if (onRefresh) {
        onRefresh()
      }

      if (response.data) {
        setSuccessMessage(`Successfully imported ${response.data.created} sites. ${response.data.errors?.length || 0} errors.`)
      }
    } catch (error: any) {
      console.error("Error bulk importing:", error)
      setImportErrors([error?.message || "Failed to import sites"])
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportSites = async () => {
    setIsExporting(true)
    try {
      // Build current filters for export
      const exportFilters: any = {}
      if (statusFilter !== "all") exportFilters.status = statusFilter
      if (siteTypeFilter !== "all") exportFilters.site_type = siteTypeFilter
      if (operatorTypeFilter !== "all") exportFilters.operator_type = operatorTypeFilter
      if (municipalityFilter !== "all") exportFilters.municipality = municipalityFilter
      if (servicePartnerFilter !== "all") exportFilters.service_partner = servicePartnerFilter
      if (programFilter !== "all") exportFilters.programs = [programFilter]
      if (searchTerm) exportFilters.search = searchTerm

      const blob = await exportSitesToCSV(exportFilters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `collection-sites-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      setSuccessMessage("Sites exported successfully!")
    } catch (error) {
      console.error("Error exporting sites:", error)
      setImportErrors(["Failed to export sites"])
    } finally {
      setIsExporting(false)
    }
  }

  const handleSiteStatusChange = async (siteId: string | number, newStatus: string) => {
    if (!setSites) return

    setIsSaving(true)
    try {
      // Call API to update site status
      const updatedSite = await updateSite(siteId.toString(), { 
        status: newStatus as CollectionSite["status"] 
      })
      
      // Update local state with the updated site
      const updatedSites = safeSites.map((site) =>
        site.id === siteId ? updatedSite : site
      )
      setSites(updatedSites)
      setSuccessMessage(`Site status updated to ${newStatus}`)
      
      // Refresh data from server to ensure consistency
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error("Error updating site status:", error)
      setImportErrors([`Error updating site status: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setIsSaving(false)
    }
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

      {importErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <div className="space-y-1">
              <div className="font-medium">Import Errors:</div>
              {importErrors.map((error, index) => (
                <div key={index} className="text-sm">
                  • {error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search & Filters - Moved to top */}
        <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* <Button variant="outline" size="sm" onClick={clearFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button> */}
              <Button variant="outline" size="sm" onClick={() => setIsBulkImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportSites} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Site
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Collection Site</DialogTitle>
                    <DialogDescription>Enter the details for the new collection site</DialogDescription>
                  </DialogHeader>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Information</TabsTrigger>
                      <TabsTrigger value="location">Location</TabsTrigger>
                      <TabsTrigger value="programs">Programs & Materials</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Site Name *</Label>
                          <Input
                            id="name"
                            value={newSite.name}
                            onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                            placeholder="Enter site name"
                            required
                          />
                        </div>

                      <div className="space-y-2">
                        <Label htmlFor="service_partner">Service Partner</Label>
                        <Input
                          id="service_partner"
                          value={newSite.service_partner}
                          onChange={(e) => setNewSite({ ...newSite, service_partner: e.target.value })}
                          placeholder="Enter service partner (e.g., link Canadian Tire Toronto with Canadian Tire Markham)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Link related sites under the same service partner (e.g., Canadian Tire Toronto with Canadian Tire Markham)
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Site Type *</Label>
                          <Select
                            value={newSite.site_type}
                            onValueChange={(value) => setNewSite({ ...newSite, site_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select site type" />
                            </SelectTrigger>
                            <SelectContent>
                              {siteTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="operator_type">Operator Type *</Label>
                        <Select
                          value={newSite.operator_type}
                          onValueChange={(value) => setNewSite({ ...newSite, operator_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator type" />
                          </SelectTrigger>
                          <SelectContent>
                            {operatorTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          value={newSite.address}
                          onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                          placeholder="Enter complete address"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="municipality">Community *</Label>
                          <Select
                            value={newSite.municipality_id}
                            onValueChange={(value) => setNewSite({ ...newSite, municipality_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select community" />
                            </SelectTrigger>
                            <SelectContent>
                              {safeMunicipalities.map((municipality) => (
                                <SelectItem key={municipality.id} value={municipality.id}>
                                  {municipality.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={newSite.status}
                            onValueChange={(value) =>
                              setNewSite({ ...newSite, status: value as CollectionSite["status"] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="location" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address_line1">Address Line 1 *</Label>
                          <Input
                            id="address_line1"
                            value={newSite.address_line1 || ''}
                            onChange={(e) => setNewSite({ ...newSite, address_line1: e.target.value })}
                            placeholder="Street address, P.O. box, etc."
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address_line2">Address Line 2</Label>
                          <Input
                            id="address_line2"
                            value={newSite.address_line2 || ''}
                            onChange={(e) => setNewSite({ ...newSite, address_line2: e.target.value })}
                            placeholder="Apartment, suite, unit, building, floor, etc."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={newSite.city || ''}
                            onChange={(e) => setNewSite({ ...newSite, city: e.target.value })}
                            placeholder="City"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state_province">State/Province *</Label>
                          <Input
                            id="state_province"
                            value={newSite.state_province || ''}
                            onChange={(e) => setNewSite({ ...newSite, state_province: e.target.value })}
                            placeholder="State or Province"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postal_code">Postal/Zip Code *</Label>
                          <Input
                            id="postal_code"
                            value={newSite.postal_code || ''}
                            onChange={(e) => setNewSite({ ...newSite, postal_code: e.target.value })}
                            placeholder="Postal or ZIP code"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="community">Community (Census Subdivision) *</Label>
                        <Select
                          value={newSite.community}
                          onValueChange={(value) => setNewSite({ ...newSite, community: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select community from census data" />
                          </SelectTrigger>
                          <SelectContent>
                            {safeMunicipalities.map((municipality) => (
                              <SelectItem key={municipality.id} value={municipality.name}>
                                {municipality.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="region_district">Region/District</Label>
                        <Select
                          value={newSite.region_district}
                          onValueChange={(value) => setNewSite({ ...newSite, region_district: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select region or district" />
                          </SelectTrigger>
                          <SelectContent>
                            {onRegionsDistricts.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service_area">Service Area (ON Zone 1-9)</Label>
                        <Select
                          value={newSite.service_area?.toString() || ""}
                          onValueChange={(value) =>
                            setNewSite({ ...newSite, service_area: value ? Number.parseInt(value) : undefined })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service area zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((zone) => (
                              <SelectItem key={zone} value={zone.toString()}>
                                Zone {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="any"
                            value={newSite.latitude}
                            onChange={(e) =>
                              setNewSite({ ...newSite, latitude: Number.parseFloat(e.target.value) || 0 })
                            }
                            placeholder="Enter latitude"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="any"
                            value={newSite.longitude}
                            onChange={(e) =>
                              setNewSite({ ...newSite, longitude: Number.parseFloat(e.target.value) || 0 })
                            }
                            placeholder="Enter longitude"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="active_dates">Active Dates</Label>
                        <Input
                          id="active_dates"
                          type="date"
                          value={newSite.active_dates}
                          onChange={(e) => setNewSite({ ...newSite, active_dates: e.target.value })}
                        />
                      </div>

                    </TabsContent>

                    <TabsContent value="programs" className="space-y-4">
                      <div className="space-x-2 ">
                        <Label className="text-md font-bold">Programs *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          {programs.map((program) => (
                            <div key={program} className="flex items-center space-x-2">
                              <Checkbox
                                id={`program-${program}`}
                                checked={newSite.programs.includes(program)}
                                onCheckedChange={(checked) => handleProgramChange(program, checked === true)}
                              />
                              <label
                                htmlFor={`program-${program}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {program}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-md font-bold">Materials Collected/Services</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          {materialsServices.map((material) => (
                            <div key={material} className="flex items-center space-x-2">
                              <Checkbox
                                id={`material-${material}`}
                                checked={newSite.materials_collected.includes(material)}
                                onCheckedChange={(checked) => handleMaterialChange(material, checked === true)}
                              />
                              <label
                                htmlFor={`material-${material}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {material}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-md font-bold">Collection Sector</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          {collectionSectors.map((scope) => (
                            <div key={scope} className="flex items-center space-x-2">
                              <Checkbox
                                id={`scope-${scope}`}
                                checked={newSite.collection_scope.includes(scope)}
                                onCheckedChange={(checked) => handleScopeChange(scope, checked === true)}
                              />
                              <label
                                htmlFor={`scope-${scope}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {scope}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSite} disabled={isSaving}>
                      {isSaving ? "Adding..." : "Add Site"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full">
              <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                placeholder="Search sites by name, address, or community..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
                />
              </div>
            </div>

          {/* All Filters - Always Visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              notifyFilterChange({ status: value, site_type: siteTypeFilter, operator_type: operatorTypeFilter, municipality: municipalityFilter, service_partner: servicePartnerFilter, program: programFilter })
            }}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            <div className="space-y-2">
              <Label>Program</Label>
            <Select value={programFilter} onValueChange={(value) => {
              setProgramFilter(value)
              notifyFilterChange({ status: statusFilter, site_type: siteTypeFilter, operator_type: operatorTypeFilter, municipality: municipalityFilter, service_partner: servicePartnerFilter, program: value })
            }}>
                <SelectTrigger>
                  <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            <div className="space-y-2">
              <Label>Community</Label>
            <Select value={municipalityFilter} onValueChange={(value) => {
              setMunicipalityFilter(value)
              notifyFilterChange({ status: statusFilter, site_type: siteTypeFilter, operator_type: operatorTypeFilter, municipality: value, service_partner: servicePartnerFilter, program: programFilter })
            }}>
                <SelectTrigger>
                  <SelectValue placeholder="Community" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                {safeMunicipalities.map((municipality) => (
                  <SelectItem key={municipality.id} value={municipality.name}>
                    {municipality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

              <div className="space-y-2">
              <Label>Service Partner</Label>
              <Select value={servicePartnerFilter} onValueChange={(value) => {
                setServicePartnerFilter(value)
                notifyFilterChange({ status: statusFilter, site_type: siteTypeFilter, operator_type: operatorTypeFilter, municipality: municipalityFilter, service_partner: value, program: programFilter })
              }}>
                  <SelectTrigger>
                  <SelectValue placeholder="Service Partner" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {servicePartners.map((partner) => (
                    <SelectItem key={partner} value={partner}>
                      {partner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
              <Label>Site Type</Label>
              <Select value={siteTypeFilter} onValueChange={(value) => {
                setSiteTypeFilter(value)
                notifyFilterChange({ status: statusFilter, site_type: value, operator_type: operatorTypeFilter, municipality: municipalityFilter, service_partner: servicePartnerFilter, program: programFilter })
              }}>
                  <SelectTrigger>
                  <SelectValue placeholder="Site Type" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {siteTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
              <Label>Operator Type</Label>
              <Select value={operatorTypeFilter} onValueChange={(value) => {
                setOperatorTypeFilter(value)
                notifyFilterChange({ status: statusFilter, site_type: siteTypeFilter, operator_type: value, municipality: municipalityFilter, service_partner: servicePartnerFilter, program: programFilter })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Operator Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {operatorTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Range Start</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    placeholder="Start date"
                  />
            </div>
            <div className="space-y-2">
              <Label>Date Range End</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    placeholder="End date"
                  />
                </div>
              </div>
        </CardContent>
      </Card>

      {/* Statistics Cards - Moved below search */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <div className="h-4 w-4 bg-blue-400 rounded-full shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{siteStats.total}</div>
            <p className="text-xs text-muted-foreground truncate">Filtered sites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-4 w-4 bg-green-400 rounded-full shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-600">{siteStats.active}</div>
            <p className="text-xs text-muted-foreground truncate">Operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <div className="h-4 w-4 bg-yellow-400 rounded-full shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-yellow-600">{siteStats.scheduled}</div>
            <p className="text-xs text-muted-foreground truncate">Upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <div className="h-4 w-4 bg-gray-400 rounded-full shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-gray-600">{siteStats.inactive}</div>
            <p className="text-xs text-muted-foreground truncate">Deactivated</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Filtered</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{siteStats.filtered}</div>
            <p className="text-xs text-muted-foreground truncate">Matching filters</p>
          </CardContent>
        </Card>
            </div>

      {/* Bulk Operations */}
      {selectedSites.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                <span className="font-medium text-sm sm:text-base">{selectedSites.size} sites selected</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedSites(new Set())} className="w-full sm:w-auto">
                  <X className="w-4 h-4 mr-2" />
                  Clear Selection
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="bg-black text-white " size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sites Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Collection Sites 
            {totalItems > 0 ? (
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredSites.length} shown, {totalItems} total)
              </span>
            ) : (
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredSites.length})
              </span>
            )}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="w-4 h-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.siteInfo}
                onCheckedChange={() => toggleColumn("siteInfo")}
              >
                Site Information
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.siteType}
                onCheckedChange={() => toggleColumn("siteType")}
              >
                Site Type
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.operatorType}
                onCheckedChange={() => toggleColumn("operatorType")}
              >
                Operator Type
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.community}
                onCheckedChange={() => toggleColumn("community")}
              >
                Community
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.programs}
                onCheckedChange={() => toggleColumn("programs")}
              >
                Programs
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.servicePartner}
                onCheckedChange={() => toggleColumn("servicePartner")}
              >
                Service Partner
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.startDate}
                onCheckedChange={() => toggleColumn("startDate")}
              >
                Start Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.endDate}
                onCheckedChange={() => toggleColumn("endDate")}
              >
                End Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.status}
                onCheckedChange={() => toggleColumn("status")}
              >
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.actions}
                onCheckedChange={() => toggleColumn("actions")}
              >
                Actions
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {filteredSites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg font-medium mb-2">No sites found</div>
              <p className="text-sm">
                {safeSites.length === 0
                  ? "Add a new site to get started or import data from CSV"
                  : "Try adjusting your search criteria or filters"}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} sites
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSites.size === filteredSites.length && filteredSites.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  {visibleColumns.siteInfo && (
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('name')}
                      >
                        Site Information
                        {renderSortIcon('name')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.siteType && (
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('site_type')}
                      >
                        Site Type
                        {renderSortIcon('site_type')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.operatorType && (
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('operator_type')}
                      >
                        Operator Type
                        {renderSortIcon('operator_type')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.community && <TableHead>Community</TableHead>}
                  {visibleColumns.programs && <TableHead>Programs</TableHead>}
                  {visibleColumns.servicePartner && <TableHead>Service Partner</TableHead>}
                  {visibleColumns.startDate && <TableHead>Start Date</TableHead>}
                  {visibleColumns.endDate && <TableHead>End Date</TableHead>}
                  {visibleColumns.status && (
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 hover:bg-transparent"
                        onClick={() => handleSort('status')}
                      >
                        Status
                        {renderSortIcon('status')}
                      </Button>
                    </TableHead>
                  )}
                  {visibleColumns.actions && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => {
                  const sitePrograms = site.programs || []
                  const siteType = site.site_type || "Unknown"
                  const operatorType = site.operator_type || "Not Set"
                  const dateRange = parseDateRange(site.active_dates)

                  return (
                    <TableRow key={site.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSites.has(site.id)}
                          onCheckedChange={(checked) => handleSiteSelect(site.id, checked as boolean)}
                        />
                      </TableCell>
                      {visibleColumns.siteInfo && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{site.name}</div>
                            <div className="text-sm text-gray-600">{site.address}</div>
                            {site.municipality?.name && (
                              <div className="text-xs text-gray-500">Community: {site.municipality?.name}</div>
                            )}
                            {site.notes && (
                              <div className="text-xs text-blue-600 mt-1">
                                Note: {site.notes.substring(0, 50)}
                                {site.notes.length > 50 ? "..." : ""}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.siteType && (
                        <TableCell>
                          <Badge variant="outline">{siteType}</Badge>
                        </TableCell>
                      )}
                      {visibleColumns.operatorType && (
                        <TableCell>
                          <Badge variant="secondary">{operatorType}</Badge>
                        </TableCell>
                      )}
                      {visibleColumns.community && (
                        <TableCell>
                          <div>
                            <div className="font-medium">{site.municipality?.name || "Unknown"}</div>
                            {site.municipality?.tier && (
                              <div className="text-xs text-gray-500">{site.municipality?.tier} Tier</div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.programs && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(sitePrograms) &&
                              sitePrograms.map((prog, index) => (
                                <Badge key={`${prog}-${index}`} variant="secondary" className="text-xs">
                                  {prog}
                                </Badge>
                              ))}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.servicePartner && (
                        <TableCell>{site.service_partner || "—"}</TableCell>
                      )}
                      {visibleColumns.startDate && (
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-green-700 font-medium">{formatDate(dateRange.start)}</span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.endDate && (
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <CalendarDays className="w-3.5 h-3.5 text-red-500" />
                            <span className={dateRange.end ? "text-red-600 font-medium" : "text-gray-400"}>
                              {formatDate(dateRange.end)}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell>
                          <Select value={site.status} onValueChange={(value) => handleSiteStatusChange(site.id, value)}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditSite(site)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSite(site)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
              </div>
            </div>
            </>
          )}
          
          {/* Pagination */}
          {(totalItems > 0 || totalPages > 1) && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-4">
              <div className="text-sm text-muted-foreground">
                {totalItems > 0 ? (
                  <>Page {currentPage} of {totalPages} ({totalItems} total)</>
                ) : (
                  <>Page {currentPage} of {totalPages}</>
                )}
              </div>
              {/* Page Size */}
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Per Page</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => onPageSizeChange?.(parseInt(value))}
                >
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
                  onClick={() => onPageChange?.(1)}
                  disabled={!hasPrevious || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={!hasPrevious || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                {(() => {
                  const pages: number[] = [];
                  const startPage = Math.max(1, currentPage - 2);
                  const endPage = Math.min(totalPages, currentPage + 2);

                  if (currentPage <= 3) {
                    for (let i = 1; i <= Math.min(5, totalPages); i++) {
                      pages.push(i);
                    }
                  } else if (currentPage >= totalPages - 2) {
                    for (let i = Math.max(1, totalPages - 4); i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                  }

                  return pages.map((p) => (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => onPageChange?.(p)}
                    >
                      {p}
                    </Button>
                  ));
                })()}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={!hasNext || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(totalPages)}
                  disabled={!hasNext || isLoading}
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
      <Dialog open={!!editingSite} onOpenChange={(open) => !open && setEditingSite(null)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Collection Site</DialogTitle>
            <DialogDescription>Update the site information</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="programs">Programs & Materials</TabsTrigger>
            </TabsList>

            {/* Same content as Add Dialog */}
            <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Site Name *</Label>
                  <Input
                    id="edit-name"
                    value={newSite.name}
                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                    placeholder="Enter site name"
                    required
                  />
                </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service_partner">Service Partner</Label>
                <Input
                  id="edit-service_partner"
                  value={newSite.service_partner}
                  onChange={(e) => setNewSite({ ...newSite, service_partner: e.target.value })}
                  placeholder="Enter service partner (e.g., link Canadian Tire Toronto with Canadian Tire Markham)"
                />
                <p className="text-xs text-muted-foreground">
                  Link related sites under the same service partner (e.g., Canadian Tire Toronto with Canadian Tire Markham)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Site Type *</Label>
                  <Select
                    value={newSite.site_type}
                    onValueChange={(value) => setNewSite({ ...newSite, site_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site type" />
                    </SelectTrigger>
                    <SelectContent>
                      {siteTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-operator_type">Operator Type *</Label>
                <Select
                  value={newSite.operator_type}
                  onValueChange={(value) => setNewSite({ ...newSite, operator_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator type" />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Input
                  id="edit-address"
                  value={newSite.address}
                  onChange={(e) => setNewSite({ ...newSite, address: e.target.value })}
                  placeholder="Enter complete address"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-municipality">Community *</Label>
                  <Select
                    value={newSite.municipality_id}
                    onValueChange={(value) => setNewSite({ ...newSite, municipality_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select community" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeMunicipalities.map((municipality) => (
                        <SelectItem key={municipality.id} value={municipality.id}>
                          {municipality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={newSite.status}
                    onValueChange={(value) => setNewSite({ ...newSite, status: value as CollectionSite["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-community">Community (Census Subdivision) *</Label>
                <Select
                  value={newSite.community}
                  onValueChange={(value) => setNewSite({ ...newSite, community: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select community from census data" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeMunicipalities.map((municipality) => (
                      <SelectItem key={municipality.id} value={municipality.name}>
                        {municipality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-region_district">Region/District</Label>
                <Select
                  value={newSite.region_district}
                  onValueChange={(value) => setNewSite({ ...newSite, region_district: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region or district" />
                  </SelectTrigger>
                  <SelectContent>
                    {onRegionsDistricts.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service_area">Service Area (ON Zone 1-9)</Label>
                <Select
                  value={newSite.service_area?.toString() || ""}
                  onValueChange={(value) =>
                    setNewSite({ ...newSite, service_area: value ? Number.parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service area zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((zone) => (
                      <SelectItem key={zone} value={zone.toString()}>
                        Zone {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-latitude">Latitude</Label>
                  <Input
                    id="edit-latitude"
                    type="number"
                    step="any"
                    value={newSite.latitude}
                    onChange={(e) => setNewSite({ ...newSite, latitude: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="Enter latitude"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-longitude">Longitude</Label>
                  <Input
                    id="edit-longitude"
                    type="number"
                    step="any"
                    value={newSite.longitude}
                    onChange={(e) => setNewSite({ ...newSite, longitude: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="Enter longitude"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-active_dates">Active Dates</Label>
                <Input
                  id="edit-active_dates"
                  type="date"
                  value={newSite.active_dates}
                  onChange={(e) => setNewSite({ ...newSite, active_dates: e.target.value })}
                />
              </div>

            </TabsContent>

            <TabsContent value="programs" className="space-y-4">
              <div className="space-y-2">
                <Label>Programs *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {programs.map((program) => (
                    <div key={program} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-program-${program}`}
                        checked={newSite.programs.includes(program)}
                        onCheckedChange={(checked) => handleProgramChange(program, checked === true)}
                      />
                      <label
                        htmlFor={`edit-program-${program}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {program}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Materials Collected/Services</Label>
                <div className="grid grid-cols-2 gap-2">
                  {materialsServices.map((material) => (
                    <div key={material} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-material-${material}`}
                        checked={newSite.materials_collected.includes(material)}
                        onCheckedChange={(checked) => handleMaterialChange(material, checked === true)}
                      />
                      <label
                        htmlFor={`edit-material-${material}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {material}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Collection Sector</Label>
                <div className="grid grid-cols-2 gap-2">
                  {collectionSectors.map((scope) => (
                    <div key={scope} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-scope-${scope}`}
                        checked={newSite.collection_scope.includes(scope)}
                        onCheckedChange={(checked) => handleScopeChange(scope, checked === true)}
                      />
                      <label
                        htmlFor={`edit-scope-${scope}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {scope}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSite(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{siteToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteDialogOpen(false); setSiteToDelete(null); }}>
              Cancel
            </Button>
            <Button variant="outline" className="bg-black text-white" onClick={confirmDeleteSite}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Sites</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedSites.size} selected sites? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" className="bg-black text-white" onClick={confirmBulkDelete}>
              Delete {selectedSites.size} Sites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import Sites</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import collection sites. The CSV should have headers: Name (required), Address (required), Municipality (required), Site Type, Operator Type, Programs, Status, Latitude, Longitude.
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
                    <strong>Created:</strong> {bulkImportResult.created} sites
                  </p>
                  {bulkImportResult.errors && bulkImportResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-600">Errors:</p>
                      <ul className="text-sm text-red-600 list-disc list-inside max-h-40 overflow-y-auto">
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
            <Button onClick={handleBulkImport} disabled={!selectedFile || isSaving}>
              {isSaving ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
