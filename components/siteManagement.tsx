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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  ArrowUp,
  ArrowDown,
  Building2,
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
import { useCensusYears } from '@/features/communities/hooks'

import SiteFormDialog, { type CollectionSite, SITE_PROGRAMS, type SiteProgram } from './site-form-dialog'
import { PaginationControls } from '@/components/pagination-controls'

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

export default function SiteManagement() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [siteType, setSiteType] = useState<string>('')
  const [operatorType, setOperatorType] = useState<string>('')
  const [year, setYear] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const limit = 10

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedSite, setSelectedSite] = useState<CollectionSite | null>(null)
  const [editingSiteId, setEditingSiteId] = useState<number | null>(null)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [siteToDelete, setSiteToDelete] = useState<any | null>(null)

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

  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { toast } = useToast()

  const { data: censusYears } = useCensusYears()

  useEffect(() => {
    if (censusYears?.years && censusYears.years.length > 0 && year === undefined) {
      setYear(censusYears.years[0].year)
    }
  }, [censusYears, year])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(timer)
  }, [search])

  const filters: SitesFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    // use is_active like communities-management: 'all' -> undefined, 'true'/'false' -> pass through
    // Cast to any to align with API expectations if it accepts string values
    is_active: selectedStatus !== 'all' ? (selectedStatus as any) : undefined,
    site_type: siteType || undefined,
    operator_type: operatorType || undefined,
    year,
    page,
    limit,
  }), [debouncedSearch, selectedStatus, siteType, operatorType, year, page])

  const { data, isLoading, error } = useSites(filters)

  const { data: siteData, isLoading: siteLoading } = useSite(editingSiteId || undefined)

  // Mutations
  const deleteMutation = useDeleteSite()
  const createSiteMutation = useCreateSite()
  const updateSiteMutation = useUpdateSite()
  const importSiteMutation = useImportSiteCensusData()
  const exportSiteMutation = useExportSiteCensusData()

  const totalSites = data?.count || 0
  const activeSites = data?.results.filter(site => site.is_active).length || 0
  const inactiveSites = totalSites - activeSites
  const scheduledSites = data?.results.filter(site => site.site_start_date && new Date(site.site_start_date) > new Date()).length || 0
  const hasNext = Boolean(data?.next)
  const hasPrev = Boolean(data?.previous)

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
        materials_collected: [], // Map from site data
        collection_scope: [], // Map from site data
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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  // Dialog handlers
  const handleAddSite = () => {
    setDialogMode('add')
    setSelectedSite(null)
    setIsDialogOpen(true)
  }

  const handleEditSite = (siteId: number) => {
    setDialogMode('edit')
    setEditingSiteId(siteId)
    setIsDialogOpen(true)
  }

  const handleSiteSubmit = async (siteData: CollectionSite) => {
    console.log('handleSiteSubmit called with:', siteData)
    try {
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

      if (dialogMode === 'add') {
        // Transform the data to match API expectations
        const apiData = {
          ...basePayload,
          ...programPayload,
        }

        console.log('Transformed API data:', apiData)
        console.log('Calling createSiteMutation.mutateAsync')
        const result = await createSiteMutation.mutateAsync(apiData)
        console.log('Site created successfully:', result)
        setSuccessMessage('Site created successfully')
      } else {
        // Update site
        console.log('Updating site:', siteData)
        const apiData = {
          ...basePayload,
          ...programPayload,
        }

        console.log('Transformed update API data:', apiData)
        console.log('Calling updateSiteMutation.mutateAsync with site ID:', editingSiteId)
        const result = await updateSiteMutation.mutateAsync({ id: editingSiteId?.toString() || '', data: apiData })
        console.log('Site updated successfully:', result)
        setSuccessMessage('Site updated successfully')
      }
      setIsDialogOpen(false)
      setSelectedSite(null)
    } catch (error) {
      console.error('Error saving site:', error)
      setErrorMessage('Failed to save site')
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
      await deleteMutation.mutateAsync(siteToDelete.id)
      setSuccessMessage(`Site "${siteToDelete.site_name}" deleted successfully`)
      setIsDeleteDialogOpen(false)
      setSiteToDelete(null)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete site')
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
      await importSiteMutation.mutateAsync(selectedImportFile)
      toast({
        title: 'Import complete',
        description: 'Site census data processed successfully.',
      })
      setImportErrorDetails(null)
      handleCloseImportDialog()
    } catch (error: any) {
      const errorPayload =
        error?.response?.data ||
        error?.data ||
        { error: error?.message || 'Failed to import site census data.' }

      toast({
        title: 'Import failed',
        description:
          typeof errorPayload?.error === 'string'
            ? errorPayload.error
            : 'Check the CSV and try again.',
        variant: 'destructive',
      })
      setImportErrorDetails(errorPayload)
      handleCloseImportDialog()
    }
  }

  const handleExportSites = async () => {
    try {
      const blob = await exportSiteMutation.mutateAsync()
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
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}
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
                <pre className='whitespace-pre-wrap wrap-break-word rounded-md bg-white/70 p-2 text-xs text-red-900 max-h-40 overflow-auto'>
                  {importErrorDetails.provided_headers.join('\n')}
                </pre>
              </div>
            )}
            {importErrorDetails.rows && importErrorDetails.rows.length > 0 && (
              <div>
                <p className='text-sm font-medium'>Problem rows:</p>
                <pre className='whitespace-pre-wrap wrap-break-word rounded-md bg-white/70 p-2 text-xs text-red-900 max-h-40 overflow-auto'>
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
                  placeholder='Search by site name, community...'
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
              <span className='text-sm text-gray-600'>Need a reference?</span>
              <Button variant='secondary' onClick={handleTemplateDownload} disabled={templateDownloading}>
                <Download className='h-4 w-4 mr-2' />
                {templateDownloading ? 'Preparing download...' : 'Download sample CSV'}
              </Button>
            </div>
            <div
              className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200'}`}
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
                <UploadCloud className='h-6 w-6 text-gray-400' />
                <div>
                  <p className='text-sm font-medium text-gray-900'>Click to select or drag and drop</p>
                  <p className='text-xs text-gray-500'>CSV files only • Max 10MB</p>
                </div>
              </label>
              {selectedImportFile && (
                <p className='mt-3 text-sm text-gray-700'>
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
            <div className='flex gap-2'>
              <div>
                <Label htmlFor='status'>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='true'>Active</SelectItem>
                    <SelectItem value='false'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='siteType'>Site Type</Label>
                <Select value={siteType || 'all'} onValueChange={(value) => setSiteType(value === 'all' ? '' : value)}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Collection Site'>Collection Site</SelectItem>
                    <SelectItem value='Event'>Event</SelectItem>
                   
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='operatorType'>Operator Type</Label>
                <Select value={operatorType || 'all'} onValueChange={(value) => setOperatorType(value === 'all' ? '' : value)}>
                  <SelectTrigger className='w-40'>
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
              <div>
                <Label htmlFor='year'>Census Year</Label>
                <Select value={year?.toString() || ''} onValueChange={(value) => setYear(value ? parseInt(value) : undefined)}>
                  <SelectTrigger className='w-32'>
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
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
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

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Scheduled</CardTitle>
            <Calendar className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{scheduledSites}</div>
            <p className='text-xs text-muted-foreground'>Future activation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Inactive</CardTitle>
            <X className='h-4 w-4 text-gray-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-600'>{inactiveSites}</div>
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
              <Button size='sm' onClick={handleAddSite}>
                <Plus className='w-4 h-4 mr-2' />
                Add Site
              </Button>
            </div>
          </div>
        </CardHeader>
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
                          <Checkbox />
                        </TableHead>
                        <TableHead>Site Information</TableHead>
                        <TableHead>Site Type</TableHead>
                        <TableHead>Operator Type</TableHead>
                        <TableHead>Community</TableHead>
                        <TableHead>Programs</TableHead>
                        <TableHead>Service Partner</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.results.map((site) => (
                        <TableRow key={site.id}>
                          <TableCell>
                            <Checkbox />
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
                          <TableCell colSpan={11} className='text-center py-8 text-gray-500'>
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
            <Button variant="outline" className='bg-black text-white hover:bg-black/70 hover:text-white' onClick={confirmDeleteSite} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}