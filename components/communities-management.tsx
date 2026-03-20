'use client'

import type React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { YearPicker } from '@/components/ui/year-picker'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { PaginationControls } from '@/components/pagination-controls'
import {
  Building2,
  Search,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  UploadCloud,
  Download,
} from 'lucide-react'

import { useCommunities, useCreateCommunity, useCreateCommunityCensus, useUpdateCommunity, useDeleteCommunity, useCommunity, useCensusYears, useBulkImportCommunities, downloadCommunityCensusTemplate } from '@/features/communities'
import type { Community, CommunityCensus } from '@/features/communities'
import type { Region } from '@/features/regions'
import { useRegions } from '@/features/regions'

// Validation schema
const communitySchema = yup.object().shape({
  name: yup.string().required('Community name is required').min(2, 'Name must be at least 2 characters'),
  population: yup.number().required('Population is required').min(1, 'Population must be at least 1').max(10000000, 'Population cannot exceed 10 million'),
  tier: yup.string().required('Tier is required'),
  province: yup.string().required('Province is required'),
  region: yup.string().required('Region is required'),
  zone: yup.string().required('Zone is required'),
  census_year: yup.number().required('Census year is required').min(1900, 'Year must be 1900 or later').max(new Date().getFullYear() + 10, 'Year cannot be too far in the future'),
  is_active: yup.boolean().required('Active status is required'),
  start_date: yup.date().nullable(),
  end_date: yup.date().nullable(),
})

interface UserData {
  username: string
  name: string
  role: string
}

// Community Form Component (for both edit and create)
function CommunityForm({
  mode,
  community,
  censusYearsData,
  onSubmit,
  loading,
  onCancel
}: {
  mode: 'edit' | 'create'
  community?: CommunityCensus
  censusYearsData: { years: Array<{ id: number; year: number }> } | undefined
  onSubmit: (data: any) => void
  loading: boolean
  onCancel: () => void
}) {
  const form = useForm({
    resolver: yupResolver(communitySchema),
    defaultValues: mode === 'edit' && community ? {
      name: community.community_name,
      population: community.population || 0,
      tier: community.tier || '1',
      province: community.province || 'BC',
      region: community.region || '',
      zone: community.zone || '',
      census_year: community.census_year_value || 2021,
      is_active: community.is_active,
      start_date: community.start_date ? (() => {
        const d = new Date(community.start_date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })() : null,
      end_date: community.end_date ? (() => {
        const d = new Date(community.end_date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })() : null,
    } : {
      name: '',
      population: 0,
      tier: '1',
      province: 'BC',
      region: '',
      zone: '',
      census_year: new Date().getFullYear(),
      is_active: true,
      start_date: null,
      end_date: null,
    },
  })

  const handleFormSubmit = (data: any) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor={`${mode}-name`}>Name *</Label>
        <Input
          id={`${mode}-name`}
          className={form.formState.errors.name ? 'border-red-500' : ''}
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${mode}-population`}>Population</Label>
        <Input
          id={`${mode}-population`}
          type="number"
          className={form.formState.errors.population ? 'border-red-500' : ''}
          {...form.register('population')}
        />
        {form.formState.errors.population && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.population.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${mode}-tier`}>Tier</Label>
        <Input
          id={`${mode}-tier`}
          type="text"
          className={form.formState.errors.tier ? 'border-red-500' : ''}
          {...form.register('tier')}
        />
        {form.formState.errors.tier && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.tier.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${mode}-region`}>Region</Label>
        <Input
          id={`${mode}-region`}
          className={form.formState.errors.region ? 'border-red-500' : ''}
          {...form.register('region')}
          placeholder="Enter region"
        />
        {form.formState.errors.region && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.region.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${mode}-province`}>Province</Label>
        <Input
          id={`${mode}-province`}
          className={form.formState.errors.province ? 'border-red-500' : ''}
          {...form.register('province')}
        />
        {form.formState.errors.province && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.province.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${mode}-zone`}>Zone</Label>
        <Input
          id={`${mode}-zone`}
          className={form.formState.errors.zone ? 'border-red-500' : ''}
          {...form.register('zone')}
          placeholder="Enter zone"
        />
        {form.formState.errors.zone && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.zone.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor={`${mode}-census-year`}>Census Year</Label>
        <Select
          value={form.watch('census_year').toString()}
          onValueChange={(value) => form.setValue('census_year', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select census year" />
          </SelectTrigger>
          <SelectContent>
            {censusYearsData?.years?.sort((a: { year: number; id: number }, b: { year: number; id: number }) => b.year - a.year).map((year: { year: number; id: number }) => (
              <SelectItem key={year.id} value={year.year.toString()}>
                {year.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.census_year && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.census_year.message}</p>
        )}
      </div>
      <div className='flex gap-2'>
      <div className='w-full'>
        <Label htmlFor={`${mode}-start-date`}>Start Date</Label>
        <Input
          id={`${mode}-start-date`}
          type="date"
          className={form.formState.errors.start_date ? 'border-red-500' : ''}
          {...form.register('start_date')}
        />
        {form.formState.errors.start_date && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.start_date.message}</p>
        )}
      </div>
      <div className='w-full'>
        <Label htmlFor={`${mode}-end-date`}>End Date</Label>
        <Input
          id={`${mode}-end-date`}
          type="date"
          className={form.formState.errors.end_date ? 'border-red-500' : ''}
          {...form.register('end_date')}
        />
        {form.formState.errors.end_date && (
          <p className="text-sm text-red-500 mt-1">{form.formState.errors.end_date.message}</p>
        )}
      </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${mode}-is-active`}
          checked={form.watch('is_active')}
          onCheckedChange={(checked) => form.setValue('is_active', checked as boolean)}
        />
        <Label htmlFor={`${mode}-is-active`}>Active</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (mode === 'edit' ? 'Saving...' : 'Adding...') : (mode === 'edit' ? 'Save Changes' : 'Add Community')}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function CommunitiesManagement() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [provinceFilter, setProvinceFilter] = useState<string>('all')
  const [selectedCensusYear, setSelectedCensusYear] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Sort state
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1)
  const [sortBy, setSortBy] = useState('created_at')

  // Dialog state
  const [dialogMode, setDialogMode] = useState<'edit' | 'create' | null>(null)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityCensus | null>(null)
  const [editingCommunityId, setEditingCommunityId] = useState<string | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null)
  const [templateDownloading, setTemplateDownloading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [communityToDelete, setCommunityToDelete] = useState<CommunityCensus | null>(null)

  // Form state - Remove old state management
  // const [editForm, setEditForm] = useState({...})
  // const [newCommunityForm, setNewCommunityForm] = useState({...})

  // React Hook Form setup (deprecated, now in CommunityForm)
  // const createForm = useForm({
  //   resolver: yupResolver(communitySchema),
  //   defaultValues: {
  //     name: '',
  //     population: 0,
  //     tier: '1' as string,
  //     province: 'BC',
  //     region: '',
  //     zone: '',
  //     census_year: new Date().getFullYear(),
  //     is_active: true,
  //   },
  // })

  // UI state
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [importErrorDetails, setImportErrorDetails] = useState<{ error?: string; expected_headers?: string[]; provided_headers?: string[] } | null>(null)
  const [importUploadError, setImportUploadError] = useState<string | null>(null)
  const { toast } = useToast()
  // const [regions, setRegions] = useState<Region[]>([])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query params for React Query
  const queryParams = useMemo(() => {
    return {
      page,
      limit: pageSize,
      search: debouncedSearch || undefined,
      year: selectedCensusYear !== 'all' ? parseInt(selectedCensusYear) : undefined,
      tier: tierFilter !== 'all' ? tierFilter : undefined,
      region: regionFilter !== 'all' ? regionFilter : undefined,
      is_active: selectedStatus !== 'all' ? selectedStatus : undefined,
      sort: sortOrder === -1 ? `-${sortBy}` : sortBy,
    }
  }, [page, pageSize, debouncedSearch, tierFilter, regionFilter, selectedCensusYear, selectedStatus, sortOrder, sortBy])

  // Fetch communities using React Query
  const { data: communitiesResponse, isLoading, error, refetch } = useCommunities(queryParams)

  // Fetch census years
  const { data: censusYearsData, isLoading: isCensusYearsLoading } = useCensusYears()

  // Fetch regions

  // Fetch single community for editing
  const { data: editingCommunityData, isLoading: editingCommunityLoading, error: editingCommunityError } = useCommunity(editingCommunityId || '', !!editingCommunityId)

  // Mutations
  const createMutation = useCreateCommunityCensus()
  const updateMutation = useUpdateCommunity()
  const deleteMutation = useDeleteCommunity()
  const bulkImportMutation = useBulkImportCommunities()

  // Extract data from response
  const communitiesData = useMemo(() => {
    return communitiesResponse || { count: 0, next: null, previous: null, results: [] }
  }, [communitiesResponse])

  const communities = communitiesData.results || []

  // Set latest census year as default when data loads
  useEffect(() => {
    if (censusYearsData?.years && censusYearsData.years.length > 0) {
      const latestYear = Math.max(...censusYearsData.years.map((y: { year: number }) => y.year))
      setSelectedCensusYear(latestYear.toString())
    }
  }, [censusYearsData])

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

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
    }
  }, [])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 1 ? -1 : 1)
    } else {
      setSortBy(field)
      setSortOrder(-1)
    }
  }

  const handleEditCommunity = (community: CommunityCensus) => {
    setEditingCommunityId(community.id.toString())
    setDialogMode('edit')
  }

  const handleAddCommunity = () => {
    setSelectedCommunity(null)
    setDialogMode('create')
  }

  const onSubmitEdit = async (data: any) => {
    if (!editingCommunityData) return

    try {
      // Transform data to match API format (same as create)
      const apiData = {
        community: data.name,
        population: data.population,
        tier: data.tier,
        region: data.region,
        zone: data.zone,
        province: data.province,
        census_year: data.census_year,
        is_active: data.is_active,
        start_date: data.start_date ? (() => {
          const d = new Date(data.start_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null,
        end_date: data.end_date ? (() => {
          const d = new Date(data.end_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null,
      }

      await updateMutation.mutateAsync({
        id: editingCommunityData.id.toString(),
        data: apiData,
      })

      setDialogMode(null)
      setSelectedCommunity(null)
      setEditingCommunityId(null)
      setSuccessMessage(`Community "${data.name}" updated successfully`)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update community')
    }
  }

  const onSubmitCreate = async (data: any) => {
    try {
      // Transform data to match API format
      const apiData = {
        community: data.name,
        population: data.population,
        tier: data.tier,
        region: data.region,
        zone: data.zone,
        province: data.province,
        census_year: data.census_year,
        is_active: data.is_active,
        start_date: data.start_date ? (() => {
          const d = new Date(data.start_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null,
        end_date: data.end_date ? (() => {
          const d = new Date(data.end_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null,
      }

      await createMutation.mutateAsync(apiData)

      setDialogMode(null)
      setSelectedCommunity(null)
      setSuccessMessage(`Community "${data.name}" added successfully`)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to add community')
    }
  }

  const handleCloseDialog = () => {
    setDialogMode(null)
    setSelectedCommunity(null)
    setEditingCommunityId(null)
  }

  const handleOpenImportDialog = () => {
    setSelectedImportFile(null)
    setImportErrorDetails(null)
    setImportUploadError(null)
    setIsImportDialogOpen(true)
  }

  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false)
    setSelectedImportFile(null)
    setImportUploadError(null)
  }

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      setSelectedImportFile(null)
      setImportUploadError(null)
      return
    }

    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    if (!isCsv) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a .csv file.',
        variant: 'destructive',
      })
      setSelectedImportFile(null)
      setImportUploadError('Invalid format. Only .csv files are supported for import.')
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
    if (!isDragActive) {
      setIsDragActive(true)
    }
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

  const handleTemplateDownload = async () => {
    try {
      setTemplateDownloading(true)
      const blob = await downloadCommunityCensusTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'community-census-template.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error.message || 'Unable to retrieve sample CSV',
        variant: 'destructive',
      })
    } finally {
      setTemplateDownloading(false)
    }
  }

  const handleImportSubmit = async () => {
    if (!selectedImportFile) {
      toast({
        title: 'No file selected',
        description: 'Please choose a CSV file to import.',
        variant: 'destructive'
      })
      return
    }

    try {
      await bulkImportMutation.mutateAsync(selectedImportFile)
      toast({
        title: 'Import complete',
        description: 'Community data processed successfully.',
      })
      setImportErrorDetails(null)
      handleCloseImportDialog()
    } catch (error: any) {
      const errorDetails = error?.data?.error || error.message || 'Failed to import community data'
      toast({
        title: 'Import failed',
        description: typeof errorDetails === 'string' ? errorDetails : 'Check the CSV and try again.',
        variant: 'destructive',
      })
      setImportErrorDetails(error?.data || { error: errorDetails })
      handleCloseImportDialog()
    }
  }

  const handleDeleteCommunity = (community: CommunityCensus) => {
    setCommunityToDelete(community)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteCommunity = async () => {
    if (!communityToDelete) return

    try {
      await deleteMutation.mutateAsync(communityToDelete.id.toString())
      setSuccessMessage(`Community "${communityToDelete.community_name}" deleted successfully`)
      setIsDeleteDialogOpen(false)
      setCommunityToDelete(null)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete community')
    }
  }

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case '1':
        return 'bg-blue-100 text-blue-800'
      case '2':
        return 'bg-green-100 text-green-800'
      case 'Single':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
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
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <div className="space-y-2">
            <p className="font-semibold">{importErrorDetails.error || 'Import failed'}</p>
            {importErrorDetails.expected_headers && (
              <div>
                <p className="text-sm font-medium">Expected headers:</p>
                <p className="text-sm text-red-900">{importErrorDetails.expected_headers.join(', ')}</p>
              </div>
            )}
            {importErrorDetails.provided_headers && (
              <div>
                <p className="text-sm font-medium">Provided headers:</p>
                <pre className="whitespace-pre-wrap wrap-break-word rounded-md bg-white/70 p-2 text-xs text-red-900 max-h-40 overflow-auto">{importErrorDetails.provided_headers.join('\n')}</pre>
              </div>
            )}
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Communities Management
              </CardTitle>
              <CardDescription>
                Manage census subdivisions and community data
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleOpenImportDialog}>
                <UploadCloud className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={handleAddCommunity}>
                <Plus className="h-4 w-4 mr-2" />
                Add Community
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Upper">Upper Tier</SelectItem>
                <SelectItem value="Lower">Lower Tier</SelectItem>
                <SelectItem value="Single">Single Tier</SelectItem>
              </SelectContent>
            </Select> */}

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCensusYear} onValueChange={setSelectedCensusYear}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by census year" />
              </SelectTrigger>
              <SelectContent>
                {censusYearsData?.years?.sort((a: { year: number; id: number }, b: { year: number; id: number }) => b.year - a.year).map((year: { year: number; id: number }) => (
                  <SelectItem key={year.id} value={year.year.toString()}>
                    {year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                      Name
                      {sortBy === 'name' ? (
                        sortOrder === 1 ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('population')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                      Population
                      {sortBy === 'population' ? (
                        sortOrder === 1 ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  {/* <TableHead>Tier</TableHead> */}
                  {/* <TableHead>Region</TableHead> */}
                  {/* <TableHead>Province</TableHead>  */}
                  <TableHead>
                    Census Year
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading communities...
                    </TableCell>
                  </TableRow>
                ) : communities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No communities found
                    </TableCell>
                  </TableRow>
                ) : (
                  communities.map((community) => (
                    <TableRow key={community.id}>
                      <TableCell className="font-medium">{community.community_name}</TableCell>
                      <TableCell>{community.population?.toLocaleString() || 'N/A'}</TableCell>
                      {/* <TableCell>
                        <Badge className={getTierBadgeColor(community.tier)}>
                          {community.tier || 'N/A'}
                        </Badge>
                      </TableCell> */}
                      {/* <TableCell>{community.region || 'N/A'}</TableCell> */}
                      {/* <TableCell>{community.province || 'N/A'}</TableCell> */}
                      <TableCell>
                        {community.census_year_value}
                      </TableCell>
                      <TableCell>
                        {community.is_active === true ? (
                        <Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'>
                          <CheckCircle className='h-3 w-3 mr-1' />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant='secondary'>Inactive</Badge>
                      )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCommunity(community)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCommunity(community)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalCount={communitiesData.count}
            currentCount={communities.length}
            onPageChange={(newPage) => setPage(newPage)}
            isLoading={isLoading}
            hasNext={!!communitiesData.next}
            hasPrev={!!communitiesData.previous}
            label="communities"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogMode !== null && (dialogMode !== 'edit' || !editingCommunityLoading)} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'edit' ? 'Edit Community' : 'Add New Community'}</DialogTitle>
            <DialogDescription>{dialogMode === 'edit' ? 'Update community information' : 'Create a new community entry'}</DialogDescription>
          </DialogHeader>

          <CommunityForm
            mode={dialogMode!}
            community={dialogMode === 'edit' ? editingCommunityData : selectedCommunity ?? undefined}
            censusYearsData={censusYearsData}
            onSubmit={dialogMode === 'edit' ? onSubmitEdit : onSubmitCreate}
            loading={dialogMode === 'edit' ? (updateMutation.isPending || editingCommunityLoading) : createMutation.isPending}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseImportDialog()
        } else {
          setIsImportDialogOpen(true)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Community Census Data</DialogTitle>
            <DialogDescription>
              Upload a CSV file that follows the template to bulk import or update community census entries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-600">Need a reference?</span>
              <Button variant="secondary" onClick={handleTemplateDownload} disabled={templateDownloading}>
                <Download className="h-4 w-4 mr-2" />
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
                id="community-import-file"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImportFileChange}
              />
              <label htmlFor="community-import-file" className="flex flex-col items-center gap-2 cursor-pointer">
                <UploadCloud className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Click to select or drag and drop</p>
                  <p className="text-xs text-gray-500">CSV files only • Max 10MB</p>
                </div>
              </label>
              {selectedImportFile && (
                <p className="mt-3 text-sm text-gray-700">
                  Selected file: <span className="font-medium">{selectedImportFile.name}</span>
                </p>
              )}
              {importUploadError && (
                <p className="mt-3 text-sm text-red-600">{importUploadError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseImportDialog}>
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} disabled={bulkImportMutation.isPending || !selectedImportFile}>
              {bulkImportMutation.isPending ? 'Importing...' : 'Import Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Community</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{communityToDelete?.community_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" className='bg-black text-white hover:bg-black/70 hover:text-white' onClick={confirmDeleteCommunity} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}