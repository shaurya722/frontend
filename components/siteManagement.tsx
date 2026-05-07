'use client'

import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import axiosInstance from '@/lib/axios-instance'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  Upload,
  UploadCloud,
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
  ChevronUp,
  ChevronDown,
  Building2,
  Clock,
  BarChart3,
} from 'lucide-react'

import {
  useSites,
  useSite,
  useCreateSite,
  useUpdateSite,
  useDeleteSite,
  useImportSiteCensusData,
  useExportSiteCensusData,
  downloadSiteCensusTemplate,
} from '@/features/sites'
import type { SitesFilters, Site } from '@/features/sites'
import { useCensusYears, useInfiniteCommunityDropdown } from '@/features/communities/hooks'

import SiteFormDialog, { type CollectionSite, SITE_PROGRAMS, type SiteProgram } from './site-form-dialog'
import { PaginationControls } from '@/components/pagination-controls'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

const toDateInputValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

const toApiDateValue = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

const buildProgramSchedulesFromSite = (site: Site): CollectionSite['programSchedules'] => ({
  Paint: {
    start_date: toDateInputValue(site.program_paint_start_date),
    end_date: toDateInputValue(site.program_paint_end_date),
  },
  Lights: {
    start_date: toDateInputValue(site.program_lights_start_date),
    end_date: toDateInputValue(site.program_lights_end_date),
  },
  Solvents: {
    start_date: toDateInputValue(site.program_solvents_start_date),
    end_date: toDateInputValue(site.program_solvents_end_date),
  },
  Pesticides: {
    start_date: toDateInputValue(site.program_pesticides_start_date),
    end_date: toDateInputValue(site.program_pesticides_end_date),
  },
  Fertilizers: {
    start_date: toDateInputValue(site.program_fertilizers_start_date),
    end_date: toDateInputValue(site.program_fertilizers_end_date),
  },
})

const buildProgramPayload = (siteData: CollectionSite) => {
  const includes = (program: SiteProgram) => siteData.programs.includes(program)
  const schedule = (program: SiteProgram) => siteData.programSchedules?.[program] || { start_date: '', end_date: '' }

  return {
    program_paint: includes('Paint'),
    program_paint_start_date: includes('Paint') ? toApiDateValue(schedule('Paint').start_date) : null,
    program_paint_end_date: includes('Paint') ? toApiDateValue(schedule('Paint').end_date) : null,
    program_lights: includes('Lights'),
    program_lights_start_date: includes('Lights') ? toApiDateValue(schedule('Lights').start_date) : null,
    program_lights_end_date: includes('Lights') ? toApiDateValue(schedule('Lights').end_date) : null,
    program_solvents: includes('Solvents'),
    program_solvents_start_date: includes('Solvents') ? toApiDateValue(schedule('Solvents').start_date) : null,
    program_solvents_end_date: includes('Solvents') ? toApiDateValue(schedule('Solvents').end_date) : null,
    program_pesticides: includes('Pesticides'),
    program_pesticides_start_date: includes('Pesticides') ? toApiDateValue(schedule('Pesticides').start_date) : null,
    program_pesticides_end_date: includes('Pesticides') ? toApiDateValue(schedule('Pesticides').end_date) : null,
    program_fertilizers: includes('Fertilizers'),
    program_fertilizers_start_date: includes('Fertilizers') ? toApiDateValue(schedule('Fertilizers').start_date) : null,
    program_fertilizers_end_date: includes('Fertilizers') ? toApiDateValue(schedule('Fertilizers').end_date) : null,
  }
}

const buildMaterialsSectorsPayload = (siteData: CollectionSite) => {
  const hasMaterial = (label: string) => siteData.materials_collected?.includes(label)
  const hasSector = (label: string) => siteData.collection_scope?.includes(label)

  return {
    material_paint: !!hasMaterial('Paint'),
    material_light_bulbs: !!hasMaterial('Light bulbs'),
    material_batteries: !!hasMaterial('Batteries'),
    material_oil_filters: !!hasMaterial('Oil filters'),
    material_tires: !!hasMaterial('Tires'),
    material_electronics: !!hasMaterial('Electronics'),
    material_household_hazardous_waste: !!hasMaterial('Household hazardous waste'),
    sector_residential: !!hasSector('Residential'),
    sector_commercial: !!hasSector('Commercial'),
    sector_industrial: !!hasSector('Industrial'),
    sector_institutional: !!hasSector('Institutional'),
  }
}

// Safely extract a user-friendly message from various API response shapes
const extractMessage = (res: any, fallback: string) => {
  if (!res) return fallback
  if (typeof res.message === 'string') return res.message
  if (typeof res.detail === 'string') return res.detail
  return fallback
}

export default function SiteManagement() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [siteType, setSiteType] = useState<string>('')
  const [operatorType, setOperatorType] = useState<string>('all')
  const [year, setYear] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [communityId, setCommunityId] = useState<string>('all')
  const [communitySearch, setCommunitySearch] = useState('')

  // Sort state
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1)
  const [sortBy, setSortBy] = useState('created_at')

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedSite, setSelectedSite] = useState<CollectionSite | null>(null)
  const [editingSiteId, setEditingSiteId] = useState<number | null>(null)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [siteToDelete, setSiteToDelete] = useState<any | null>(null)
  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null)
  const [importUploadError, setImportUploadError] = useState<string | null>(null)
  const [templateDownloading, setTemplateDownloading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [importErrorDetails, setImportErrorDetails] = useState<{
    error?: string
    expected_headers?: string[]
    provided_headers?: string[]
    rows?: string[]
    details?: string
  } | null>(null)

  const { toast } = useToast()

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)


  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setBulkDeleting(true)
    try {
      await axiosInstance.post('/api/sites/bulk-delete/', { ids: selectedIds })
      toast({ title: 'Deleted', description: `Removed ${selectedIds.length} site(s).` })
      setSelectedIds([])
      try { await refetch?.() } catch {}
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete selected sites.', variant: 'destructive' })
    } finally {
      setBulkDeleting(false)
    }
  }

  const { data: censusYears } = useCensusYears()

  const {
    data: communitiesInfinite,
    fetchNextPage: fetchNextCommunityPage,
    hasNextPage: hasNextCommunityPage,
    isFetchingNextPage: isFetchingNextCommunityPage,
  } = useInfiniteCommunityDropdown(
    year,
    communitySearch,
    50,
    year !== undefined,
  )

  const communitySelectOptions = useMemo(() => {
    const rows =
      communitiesInfinite?.pages.flatMap((p) => p.communities) ?? []
    return [
      { value: 'all', label: 'All' },
      ...rows.map((c) => ({
        value: c.id,
        label: c.name,
        itemKey: `${c.id}:${c.name}`,
      })),
    ]
  }, [communitiesInfinite])

  useEffect(() => {
    if (censusYears?.years && censusYears.years.length > 0 && year === undefined) {
      setYear(censusYears.years[0].year)
    }
  }, [censusYears, year])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setCommunitySearch('')
  }, [year])

  const filters: SitesFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    // use is_active like communities-management: 'all' -> undefined, 'true'/'false' -> pass through
    // Cast to any to align with API expectations if it accepts string values
    is_active: selectedStatus !== 'all' ? (selectedStatus as any) : undefined,
    site_type: siteType || undefined,
    // Normalize operator type: do not send 'all' to API
    operator_type: operatorType && operatorType !== 'all' ? operatorType : undefined,
    communities: communityId && communityId !== 'all' ? communityId : undefined,
    year,
    sort: sortOrder === -1 ? `-${sortBy}` : sortBy,
    page,
    limit,
  }), [debouncedSearch, selectedStatus, siteType, operatorType, communityId, year, sortOrder, sortBy, page, limit])

  const { data, isLoading, error, refetch } = useSites(filters, year !== undefined)

  const allVisibleIds = useMemo(() => (data?.results || []).map((s: any) => s.id as number), [data])
  const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id))
  const someVisibleSelected = allVisibleIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      const merged = Array.from(new Set([...selectedIds, ...allVisibleIds]))
      setSelectedIds(merged)
    } else {
      const remaining = selectedIds.filter((id) => !allVisibleIds.includes(id))
      setSelectedIds(remaining)
    }
  }

  const toggleSelectOne = (id: number, checked: boolean) => {
    if (checked) setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    else setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  const { data: siteData, isLoading: siteLoading } = useSite(editingSiteId || undefined)

  // Mutations
  const deleteMutation = useDeleteSite()
  const createSiteMutation = useCreateSite()
  const updateSiteMutation = useUpdateSite()
  const importSiteMutation = useImportSiteCensusData()
  const exportSiteMutation = useExportSiteCensusData()

  const totalSites = (data as any)?.counts?.total_sites ?? data?.count ?? 0
  const activeSites = (data as any)?.counts?.active_sites ?? (data?.results.filter(site => site.is_active).length || 0)
  const inactiveSites = (data as any)?.counts?.inactive_sites ?? (totalSites - activeSites)
  const scheduledSites = data?.results.filter(site => site.site_start_date && new Date(site.site_start_date) > new Date()).length || 0
  const hasNext = Boolean(data?.next)
  const hasPrev = Boolean(data?.previous)

  const upcomingEndDates = useMemo(() => {
    const sites = data?.results || []
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    let within30 = 0
    let within60 = 0
    let within90 = 0
    let beyond90 = 0

    const programEndDates: Record<string, { within30: number; within60: number; within90: number; beyond90: number }> = {
      Paint: { within30: 0, within60: 0, within90: 0, beyond90: 0 },
      Lights: { within30: 0, within60: 0, within90: 0, beyond90: 0 },
      Solvents: { within30: 0, within60: 0, within90: 0, beyond90: 0 },
      Pesticides: { within30: 0, within60: 0, within90: 0, beyond90: 0 },
      Fertilizers: { within30: 0, within60: 0, within90: 0, beyond90: 0 },
    }

    const checkEndDate = (endDate: string | null | undefined, program?: string) => {
      if (!endDate) return
      const date = new Date(endDate)
      if (date < now) return

      if (date <= thirtyDays) {
        within30++
        if (program && programEndDates[program]) programEndDates[program].within30++
      } else if (date <= sixtyDays) {
        within60++
        if (program && programEndDates[program]) programEndDates[program].within60++
      } else if (date <= ninetyDays) {
        within90++
        if (program && programEndDates[program]) programEndDates[program].within90++
      } else {
        beyond90++
        if (program && programEndDates[program]) programEndDates[program].beyond90++
      }
    }

    for (const site of sites) {
      checkEndDate(site.site_end_date)
      if (site.program_paint) checkEndDate(site.program_paint_end_date, 'Paint')
      if (site.program_lights) checkEndDate(site.program_lights_end_date, 'Lights')
      if (site.program_solvents) checkEndDate(site.program_solvents_end_date, 'Solvents')
      if (site.program_pesticides) checkEndDate(site.program_pesticides_end_date, 'Pesticides')
      if (site.program_fertilizers) checkEndDate(site.program_fertilizers_end_date, 'Fertilizers')
    }

    const timelineData = [
      { period: 'Within 30 Days', sites: within30, fill: 'hsl(0, 84%, 60%)' },
      { period: '31-60 Days', sites: within60, fill: 'hsl(25, 95%, 53%)' },
      { period: '61-90 Days', sites: within90, fill: 'hsl(45, 93%, 47%)' },
      { period: '90+ Days', sites: beyond90, fill: 'hsl(142, 71%, 45%)' },
    ]

    const programData = Object.entries(programEndDates)
      .filter(([_, counts]) => counts.within30 + counts.within60 + counts.within90 + counts.beyond90 > 0)
      .map(([program, counts]) => ({
        program,
        'Within 30 Days': counts.within30,
        '31-60 Days': counts.within60,
        '61-90 Days': counts.within90,
        '90+ Days': counts.beyond90,
      }))

    const totalExpiring = within30 + within60 + within90
    const totalAll = within30 + within60 + within90 + beyond90

    return { timelineData, programData, totalExpiring, totalAll, hasAny: totalAll > 0 }
  }, [data])

  useEffect(() => {
    if (siteData && dialogMode === 'edit') {
      const programSchedules = buildProgramSchedulesFromSite(siteData)

      const collectionSite: CollectionSite = {
        id: siteData.id.toString(),
        name: siteData.site_name,
        service_partner: siteData.service_partner || '',
        site_type: siteData.site_type,
        operator_type: siteData.operator_type,
        address: [siteData.address_line_1, siteData.address_line_2].filter(Boolean).join(', ') || '',
        municipality_id: siteData.community || '',
        census_year: siteData.census_year,
        status: siteData.is_active ? 'Active' : 'Inactive',
        address_line1: siteData.address_line_1 || '',
        address_line2: siteData.address_line_2 || '',
        city: siteData.address_city || '',
        state_province: siteData.region || '',
        postal_code: siteData.address_postal_code || '',
        community: siteData.community_name || '',
        region_district: siteData.region || '',
        service_area: siteData.service_area,
        latitude: parseFloat(siteData.address_latitude) || 0,
        longitude: parseFloat(siteData.address_longitude) || 0,
        site_start_date: toDateInputValue(siteData.site_start_date),
        site_end_date: toDateInputValue(siteData.site_end_date),
        programs: [],
        programSchedules,
        materials_collected: [
          ...(siteData.material_paint ? ['Paint'] : []),
          ...(siteData.material_light_bulbs ? ['Light bulbs'] : []),
          ...(siteData.material_batteries ? ['Batteries'] : []),
          ...(siteData.material_oil_filters ? ['Oil filters'] : []),
          ...(siteData.material_tires ? ['Tires'] : []),
          ...(siteData.material_electronics ? ['Electronics'] : []),
          ...(siteData.material_household_hazardous_waste ? ['Household hazardous waste'] : []),
        ],
        collection_scope: [
          ...(siteData.sector_residential ? ['Residential'] : []),
          ...(siteData.sector_commercial ? ['Commercial'] : []),
          ...(siteData.sector_industrial ? ['Industrial'] : []),
          ...(siteData.sector_institutional ? ['Institutional'] : []),
        ],
      }

      // Map programs
      if (siteData.program_paint) collectionSite.programs.push('Paint')
      if (siteData.program_lights) collectionSite.programs.push('Lights')
      if (siteData.program_solvents) collectionSite.programs.push('Solvents')
      if (siteData.program_pesticides) collectionSite.programs.push('Pesticides')
      if (siteData.program_fertilizers) collectionSite.programs.push('Fertilizers')

      setSelectedSite(collectionSite)
    }
  }, [siteData, dialogMode])

  // Dialog handlers
  const handleAddSite = () => {
    setDialogMode('add')
    setSelectedSite(null)
    setIsDialogOpen(true)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 1 ? -1 : 1)
    } else {
      setSortBy(field)
      setSortOrder(-1)
    }
  }

  const handleEditSite = (siteId: number) => {
    setDialogMode('edit')
    setEditingSiteId(siteId)
    setIsDialogOpen(true)
  }

  const handleSiteSubmit = async (siteData: CollectionSite) => {
    console.log('handleSiteSubmit called with:', siteData)
    try {
      // Cross-field validation: require at least one selection across
      // Programs & Scheduling, Materials Collected/Services, or Collection Sector
      const hasAnySelection =
        (siteData.programs && siteData.programs.length > 0) ||
        (siteData.materials_collected && siteData.materials_collected.length > 0) ||
        (siteData.collection_scope && siteData.collection_scope.length > 0)

      if (!hasAnySelection) {
        toast({
          title: 'Missing required information',
          description: 'Please select at least one item in Programs & Scheduling, Materials Collected/Services, or Collection Sector.',
          variant: 'destructive',
        })
        return
      }

      const basePayload = {
        site_name: siteData.name,
        census_year: siteData.census_year,
        community: siteData.municipality_id,
        site_type: siteData.site_type,
        operator_type: siteData.operator_type,
        service_partner: siteData.service_partner || '',
        address_line_1: siteData.address_line1 || '',
        address_line_2: siteData.address_line2 || '',
        address_city: siteData.city || '',
        address_postal_code: siteData.postal_code || '',
        region: siteData.state_province || '',
        service_area: siteData.service_area?.toString() || '',
        address_latitude: siteData.latitude || 0,
        address_longitude: siteData.longitude || 0,
        latitude: siteData.latitude || 0,
        longitude: siteData.longitude || 0,
        is_active: siteData.status === 'Active',
        site_start_date: toApiDateValue(siteData.site_start_date),
        site_end_date: toApiDateValue(siteData.site_end_date),
      }

      const programPayload = buildProgramPayload(siteData)
      const materialsSectorsPayload = buildMaterialsSectorsPayload(siteData)

      if (dialogMode === 'add') {
        // Transform the data to match API expectations
        const apiData = {
          ...basePayload,
          ...programPayload,
          ...materialsSectorsPayload,
        }

        console.log('Transformed API data:', apiData)
        console.log('Calling createSiteMutation.mutateAsync')
        const result: any = await createSiteMutation.mutateAsync(apiData)
  console.log('Site created successfully:', result)
        toast({
          variant: 'success',
          title: 'Site created',
          description: extractMessage(result, 'New collection site has been added successfully.'),
        })
      } else {
        // Update site
        console.log('Updating site:', siteData)
        const apiData = {
          ...basePayload,
          ...programPayload,
          ...materialsSectorsPayload,
        }

        console.log('Transformed update API data:', apiData)
        console.log('Calling updateSiteMutation.mutateAsync with site ID:', editingSiteId)
        const result: any = await updateSiteMutation.mutateAsync({ id: editingSiteId?.toString() || '', data: apiData })
        console.log('Site updated successfully:', result)
        toast({
          variant: 'success',
          title: 'Site updated',
          description: extractMessage(result, 'Collection site has been updated successfully.'),
        })
      }
      setIsDialogOpen(false)
      setSelectedSite(null)
    } catch (error: any) {
      console.error('Error saving site:', error)
      
      // Extract error message from API response
      const errorPayload = error?.response?.data || error?.data || {}
      let errorMessage = error?.message || 'An error occurred while saving the site.'
      
      if (Array.isArray(errorPayload?.non_field_errors) && errorPayload.non_field_errors.length > 0) {
        errorMessage = errorPayload.non_field_errors.join(', ')
      } else if (typeof errorPayload?.error === 'string') {
        errorMessage = errorPayload.error
      } else if (typeof errorPayload?.message === 'string') {
        errorMessage = errorPayload.message
      } else if (typeof errorPayload?.detail === 'string') {
        errorMessage = errorPayload.detail
      } else if (Array.isArray(errorPayload?.detail)) {
        errorMessage = errorPayload.detail.join(', ')
      } else if (errorPayload && Object.keys(errorPayload).length > 0) {
        // Handle field validation errors: {field: ["error message"]}
        const errors = Object.entries(errorPayload)
          .filter(([key]) => key !== 'non_field_errors')
          .map(([field, msgs]) => {
            if (Array.isArray(msgs)) return `${field}: ${msgs.join(', ')}`
            if (typeof msgs === 'string') return `${field}: ${msgs}`
            return `${field}: ${JSON.stringify(msgs)}`
          })
          .join('; ')
        if (errors) errorMessage = errors
      }
      
      toast({
        title: 'Failed to save site',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedSite(null)
    setEditingSiteId(null)
  }

  const handleDeleteSite = (site: any) => {
    setSiteToDelete(site)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteSite = async () => {
    if (!siteToDelete) return

    try {
      const result: any = await deleteMutation.mutateAsync(siteToDelete.id)
      toast({
        variant: 'success',
        title: 'Site deleted',
        description: `"${siteToDelete.site_name}" has been deleted successfully.`,
      })
      setIsDeleteDialogOpen(false)
      setSiteToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Failed to delete site',
        description: error?.message || 'An error occurred while deleting the site.',
        variant: 'destructive',
      })
    }
  }

  const handleOpenImportDialog = () => {
    setIsImportDialogOpen(true)
    setSelectedImportFile(null)
    setImportUploadError(null)
    setImportErrorDetails(null)
  }

  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false)
    setSelectedImportFile(null)
    setImportUploadError(null)
    setIsDragActive(false)
  }

  const handleTemplateDownload = async () => {
    try {
      setTemplateDownloading(true)
      const blob = await downloadSiteCensusTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'site-census-template.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error?.message || 'Unable to download site census template.',
        variant: 'destructive',
      })
    } finally {
      setTemplateDownloading(false)
    }
  }

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      setSelectedImportFile(null)
      setImportUploadError(null)
      return
    }

    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    if (!isCsv) {
      setImportUploadError('Invalid format. Only .csv files are supported for import.')
      setSelectedImportFile(null)
      return
    }

    setSelectedImportFile(file)
    setImportUploadError(null)
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    handleFileSelection(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isDragActive) setIsDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragActive(false)
    }
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
    const file = event.dataTransfer?.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const handleImportSubmit = async () => {
    if (!selectedImportFile) {
      toast({
        title: 'No file selected',
        description: 'Please choose a CSV file to import.',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await importSiteMutation.mutateAsync(selectedImportFile)
      toast({
        variant: 'success',
        title: 'Import complete',
        description: result?.message || result?.detail || 'Site census data processed successfully.',
      })
      setImportErrorDetails(null)
      handleCloseImportDialog()
    } catch (error: any) {
      const errorPayload = error?.response?.data || error?.data || {}
      
      // Extract error message from various API response formats
      let errorMessage = 'Failed to import site census data.'
      if (typeof errorPayload?.error === 'string') {
        errorMessage = errorPayload.error
      } else if (typeof errorPayload?.message === 'string') {
        errorMessage = errorPayload.message
      } else if (typeof errorPayload?.detail === 'string') {
        errorMessage = errorPayload.detail
      } else if (Array.isArray(errorPayload?.detail)) {
        errorMessage = errorPayload.detail.join(', ')
      } else if (errorPayload && Object.keys(errorPayload).length > 0) {
        // Handle validation errors: {field: ["error message"]}
        const errors = Object.entries(errorPayload)
          .map(([field, msgs]) => {
            if (Array.isArray(msgs)) return `${field}: ${msgs.join(', ')}`
            if (typeof msgs === 'string') return `${field}: ${msgs}`
            return `${field}: ${JSON.stringify(msgs)}`
          })
          .join('; ')
        if (errors) errorMessage = errors
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast({
        title: 'Import failed',
        description: errorMessage,
        variant: 'destructive',
      })
      setImportErrorDetails(errorPayload)
      handleCloseImportDialog()
    }
  }

  const handleExportSites = async () => {
    try {
      const blob = await exportSiteMutation.mutateAsync(filters)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'site-census-data.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error?.message || 'Unable to export site census data.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className='space-y-6'>
      {importErrorDetails && (
        <Alert variant='destructive' className='border-red-300 bg-red-50'>
          <div className='space-y-2'>
            <p className='font-semibold'>
              {importErrorDetails.error || 'Import failed'}
            </p>
            {importErrorDetails.details && (
              <p className='text-sm text-red-900'>{importErrorDetails.details}</p>
            )}
            {importErrorDetails.expected_headers && (
              <div>
                <p className='text-sm font-medium'>Expected headers:</p>
                <p className='text-sm text-red-900'>
                  {importErrorDetails.expected_headers.join(', ')}
                </p>
              </div>
            )}
            {importErrorDetails.provided_headers && (
              <div>
                <p className='text-sm font-medium'>Provided headers:</p>
                <pre className='whitespace-pre-wrap wrap-break-word rounded-md bg-card/70 p-2 text-xs text-red-900 max-h-40 overflow-auto'>
                  {importErrorDetails.provided_headers.join('\n')}
                </pre>
              </div>
            )}
            {importErrorDetails.rows && importErrorDetails.rows.length > 0 && (
              <div>
                <p className='text-sm font-medium'>Problem rows:</p>
                <pre className='whitespace-pre-wrap wrap-break-word rounded-md bg-card/70 p-2 text-xs text-red-900 max-h-40 overflow-auto'>
                  {importErrorDetails.rows.join('\n')}
                </pre>
              </div>
            )}
          </div>
        </Alert>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className='pt-6 space-y-4'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-3'>
            <CardTitle className='text-lg'>Search & Filters</CardTitle>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleOpenImportDialog}
              >
                <Upload className='w-4 h-4 mr-2' />
                Import CSV
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleExportSites}
                disabled={exportSiteMutation.isPending}
              >
                <Download className='w-4 h-4 mr-2' />
                {exportSiteMutation.isPending ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1'>
              <Label htmlFor='search'>Search Sites</Label>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  id='search'
                  placeholder='Search by site name...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-8'
                />

      <Dialog open={isImportDialogOpen} onOpenChange={(open) => (open ? handleOpenImportDialog() : handleCloseImportDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Site Census Data</DialogTitle>
            <DialogDescription>
              Upload a CSV that follows the site census template to bulk import entries.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex flex-col gap-2'>
              <span className='text-sm text-muted-foreground'>Need a reference?</span>
              <Button variant='secondary' onClick={handleTemplateDownload} disabled={templateDownloading}>
                <Download className='h-4 w-4 mr-2' />
                {templateDownloading ? 'Preparing download...' : 'Download sample CSV'}
              </Button>
            </div>
            <div
              className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
            >
              <input
                id='site-import-file'
                type='file'
                accept='.csv'
                className='hidden'
                onChange={handleImportFileChange}
              />
              <label htmlFor='site-import-file' className='flex flex-col items-center gap-2 cursor-pointer'>
                <UploadCloud className='h-6 w-6 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium text-foreground'>Click to select or drag and drop</p>
                  <p className='text-xs text-muted-foreground'>CSV files only • Max 10MB</p>
                </div>
              </label>
              {selectedImportFile && (
                <p className='mt-3 text-sm text-foreground'>
                  Selected file: <span className='font-medium'>{selectedImportFile.name}</span>
                </p>
              )}
              {importUploadError && (
                <p className='mt-3 text-sm text-red-600'>{importUploadError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={handleCloseImportDialog}>
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} disabled={importSiteMutation.isPending || !selectedImportFile}>
              {importSiteMutation.isPending ? 'Importing...' : 'Import Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
              </div>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='true'>Active</SelectItem>
                    <SelectItem value='false'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='siteType'>Site Type</Label>
                <Select value={siteType || 'all'} onValueChange={(value) => setSiteType(value === 'all' ? '' : value)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Collection Site'>Collection Site</SelectItem>
                    <SelectItem value='Event'>Event</SelectItem>
                   
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='operatorType'>Operator Type</Label>
                <Select value={operatorType || 'all'} onValueChange={(value) => setOperatorType(value === 'all' ? '' : value)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Retailer'>Retailer</SelectItem>
                    <SelectItem value='Distributor'>Distributor</SelectItem>
                    <SelectItem value='Municipal'>Municipal</SelectItem>
                    <SelectItem value='First Nation/Indigenous'>First Nation/Indigenous</SelectItem>
                    <SelectItem value='Private Depot'>Private Depot</SelectItem>
                    <SelectItem value='Product Care'>Product Care</SelectItem>
                    <SelectItem value='Regional District'>Regional District</SelectItem>
                    <SelectItem value='Regional Service commission'>Regional Service commission</SelectItem>
                    <SelectItem value='Others'>Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='community'>Community</Label>
                <SearchableSelect
                  value={communityId}
                  onValueChange={(value) => {
                    setCommunityId(value)
                    setCommunitySearch('')
                  }}
                  placeholder='All'
                  searchPlaceholder='Search community...'
                  triggerClassName='w-full'
                  contentClassName='w-[min(100vw-2rem,28rem)]'
                  onSearchChange={setCommunitySearch}
                  hasNextPage={hasNextCommunityPage}
                  isFetchingNextPage={isFetchingNextCommunityPage}
                  onFetchNextPage={() => fetchNextCommunityPage()}
                  options={communitySelectOptions}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='year'>Census Year</Label>
                <Select value={year?.toString() || ''} onValueChange={(value) => setYear(value ? parseInt(value) : undefined)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select year' />
                  </SelectTrigger>
                  <SelectContent>
                    {censusYears?.years?.map((censusYear) => (
                      <SelectItem key={censusYear.id} value={censusYear.year.toString()}>
                        {censusYear.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site Statistics */}
      <div className='grid grid-cols-3 md:grid-cols-3 sm:grid-cols-1 xs:grid-cols-1 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sites</CardTitle>
            <Building2 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalSites}</div>
            <p className='text-xs text-muted-foreground'>Collection sites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Sites</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{activeSites}</div>
            <p className='text-xs text-muted-foreground'>Currently active</p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Scheduled</CardTitle>
            <Calendar className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-primary'>{scheduledSites}</div>
            <p className='text-xs text-muted-foreground'>Future activation</p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Inactive</CardTitle>
            <X className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-muted-foreground'>{inactiveSites}</div>
            <p className='text-xs text-muted-foreground'>Deactivated sites</p>
          </CardContent>
        </Card>
      </div>

      {/* Sites Table */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Collection Sites</CardTitle>
              <CardDescription>Manage collection sites and their information</CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <DropdownMenu>
                {/* <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Settings2 className='w-4 h-4 mr-2' />
                    Columns
                  </Button>
                </DropdownMenuTrigger> */}
                <DropdownMenuContent align='end'>
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={true}>
                    Site Information
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Site Type
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Operator Type
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Community
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Programs
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Service Partner
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Start Date
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    End Date
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Status
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={true}>
                    Actions
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size='sm'
                variant='destructive'
                disabled={selectedIds.length === 0 || bulkDeleting}
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                {bulkDeleting ? 'Deleting…' : `Delete Selected (${selectedIds.length})`}
              </Button>
              <Button size='sm' onClick={handleAddSite}>
                <Plus className='w-4 h-4 mr-2' />
                Add Site
              </Button>
            </div>
          </div>
        </CardHeader>
        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete selected sites</DialogTitle>
              <DialogDescription>
                This action cannot be undone. You are about to delete {selectedIds.length} site{selectedIds.length === 1 ? '' : 's'}. Do you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)} disabled={bulkDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={async () => { await handleBulkDelete(); setIsBulkDeleteDialogOpen(false) }} disabled={bulkDeleting || selectedIds.length === 0}>
                {bulkDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CardContent>
          {isLoading ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p>Loading sites...</p>
            </div>
          ) : error ? (
            <div className='text-center py-8'>
              <p className='text-red-500 mb-4'>Failed to load sites</p>
              <Button variant='outline'>Try Again</Button>
            </div>
          ) : (
            <>
              <div className='mb-4 text-sm text-muted-foreground'>
                Showing {data?.results.length || 0} of {totalSites} sites
              </div>
              <div className='overflow-x-auto -mx-4 sm:mx-0'>
                <div className='inline-block min-w-full align-middle px-4 sm:px-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-12'>
                          <Checkbox
                            checked={allVisibleSelected}
                            onCheckedChange={(val: any) => toggleSelectAllVisible(Boolean(val))}
                            aria-checked={allVisibleSelected ? 'true' : someVisibleSelected ? 'mixed' : 'false'}
                          />
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('site')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                            Site Information
                            {sortBy === 'site' ? (
                              sortOrder === 1 ?
                                <ChevronUp className="ml-2 h-4 w-4" /> :
                                <ChevronDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('site_type')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                            Site Type
                            {sortBy === 'site_type' ? (
                              sortOrder === 1 ?
                                <ChevronUp className="ml-2 h-4 w-4" /> :
                                <ChevronDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('operator_type')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                            Operator Type
                            {sortBy === 'operator_type' ? (
                              sortOrder === 1 ?
                                <ChevronUp className="ml-2 h-4 w-4" /> :
                                <ChevronDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('community')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                            Community
                            {sortBy === 'community' ? (
                              sortOrder === 1 ?
                                <ChevronUp className="ml-2 h-4 w-4" /> :
                                <ChevronDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Programs</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('service_partner')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                            Service Partner
                            {sortBy === 'service_partner' ? (
                              sortOrder === 1 ?
                                <ChevronUp className="ml-2 h-4 w-4" /> :
                                <ChevronDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('is_active')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                            Status
                            {sortBy === 'is_active' ? (
                              sortOrder === 1 ?
                                <ChevronUp className="ml-2 h-4 w-4" /> :
                                <ChevronDown className="ml-2 h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.results.map((site) => (
                        <TableRow key={site.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(site.id)}
                              onCheckedChange={(val: any) => toggleSelectOne(site.id, Boolean(val))}
                            />
                          </TableCell>
                          <TableCell>
                            <div className='font-medium'>{site.site_name}</div>
                            <div className='text-sm text-muted-foreground'>{site.address_city}, {site.address_postal_code}</div>
                          </TableCell>
                          <TableCell>{site.site_type}</TableCell>
                          <TableCell>{site.operator_type}</TableCell>
                          <TableCell>{site.community_name}</TableCell>
                          <TableCell>
                            <div className='flex flex-wrap gap-1'>
                              {site.program_paint && <Badge variant='secondary' className='text-xs'>Paint</Badge>}
                              {site.program_lights && <Badge variant='secondary' className='text-xs'>Lights</Badge>}
                              {site.program_solvents && <Badge variant='secondary' className='text-xs'>Solvents</Badge>}
                              {site.program_pesticides && <Badge variant='secondary' className='text-xs'>Pesticides</Badge>}
                              {site.program_fertilizers && <Badge variant='secondary' className='text-xs'>Fertilizers</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{site.service_partner}</TableCell>
                          <TableCell>{site.site_start_date ? new Date(site.site_start_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{site.site_end_date ? new Date(site.site_end_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={site.is_active ? 'default' : 'secondary'}>
                              {site.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Button variant='ghost' size='sm' onClick={() => handleEditSite(site.id)}>
                                <Edit className='w-4 h-4' />
                              </Button>
                              <Button variant='ghost' size='sm' onClick={() => handleDeleteSite(site)}>
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {data?.results.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={11} className='text-center py-8 text-muted-foreground'>
                            <div className='text-lg font-medium mb-2'>No sites found</div>
                            <p className='text-sm'>
                              Add a new site to get started or import data from CSV
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <PaginationControls
                page={page}
                pageSize={limit}
                totalCount={totalSites}
                currentCount={data?.results.length || 0}
                onPageChange={(newPage) => setPage(newPage)}
                isLoading={isLoading}
                hasNext={hasNext}
                hasPrev={hasPrev}
                label="sites"
                pageSizeOptions={[5,10, 20, 50, 100]}
                onPageSizeChange={(size) => {
                  setLimit(size)
                  setPage(1)
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <SiteFormDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        mode={dialogMode}
        site={selectedSite}
        onSubmit={handleSiteSubmit}
        isLoading={dialogMode === 'edit' ? siteLoading : false}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{siteToDelete?.site_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSite} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}