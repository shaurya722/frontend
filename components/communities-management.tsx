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
import {
  Building2,
  Search,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react'

import { useCommunities, useCreateCommunity, useUpdateCommunity, useDeleteCommunity, useCommunity } from '@/features/communities'
import type { Community, CommunityCensus } from '@/features/communities'
import { useRegions } from '@/features/regions'
import type { Region } from '@/features/regions'

// Validation schema
const communitySchema = yup.object().shape({
  name: yup.string().required('Community name is required').min(2, 'Name must be at least 2 characters'),
  population: yup.number().required('Population is required').min(1, 'Population must be at least 1').max(10000000, 'Population cannot exceed 10 million'),
  tier: yup.string().required('Tier is required').oneOf(['Single', 'Lower', 'Upper'], 'Invalid tier selected'),
  province: yup.string().required('Province is required'),
  region: yup.string().required('Region is required'),
  census_year: yup.number().required('Census year is required').min(1900, 'Year must be 1900 or later').max(new Date().getFullYear() + 10, 'Year cannot be too far in the future'),
})

interface UserData {
  username: string
  name: string
  role: string
}

// Edit Community Form Component
function EditCommunityForm({
  community,
  regions,
  onSubmit,
  loading,
  onCancel
}: {
  community: Community
  regions: Region[]
  onSubmit: (data: any) => void
  loading: boolean
  onCancel: () => void
}) {
  const editForm = useForm({
    resolver: yupResolver(communitySchema),
    defaultValues: {
      name: community.name,
      population: community.population || 0,
      tier: community.tier || 'Single',
      province: community.province || 'Ontario',
      region: community.region_detail?.id || '',
      census_year: community.census_year || 2021,
    },
  })

  const handleFormSubmit = (data: any) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={editForm.handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          className={editForm.formState.errors.name ? 'border-red-500' : ''}
          {...editForm.register('name')}
        />
        {editForm.formState.errors.name && (
          <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="edit-population">Population</Label>
        <Input
          id="edit-population"
          type="number"
          className={editForm.formState.errors.population ? 'border-red-500' : ''}
          {...editForm.register('population')}
        />
        {editForm.formState.errors.population && (
          <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.population.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="edit-tier">Tier</Label>
        <Select
          value={editForm.watch('tier')}
          onValueChange={(value) => editForm.setValue('tier', value as 'Single' | 'Lower' | 'Upper')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Upper">Upper Tier</SelectItem>
            <SelectItem value="Lower">Lower Tier</SelectItem>
            <SelectItem value="Single">Single Tier</SelectItem>
          </SelectContent>
        </Select>
        {editForm.formState.errors.tier && (
          <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.tier.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="edit-region">Region</Label>
        <Select
          value={editForm.watch('region')}
          onValueChange={(value) => editForm.setValue('region', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {editForm.formState.errors.region && (
          <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.region.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="edit-province">Province</Label>
        <Input
          id="edit-province"
          className={editForm.formState.errors.province ? 'border-red-500' : ''}
          {...editForm.register('province')}
        />
        {editForm.formState.errors.province && (
          <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.province.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="edit-census-year">Census Year</Label>
        <YearPicker
          value={editForm.watch('census_year')}
          onChange={(year) => editForm.setValue('census_year', year)}
          placeholder="Select census year"
        />
        {editForm.formState.errors.census_year && (
          <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.census_year.message}</p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
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
  const [censusYearFilter, setCensusYearFilter] = useState<string>('all')
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Sort state
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1)
  const [sortBy, setSortBy] = useState('created_at')
  
  // Dialog state
  const [editingCommunity, setEditingCommunity] = useState<CommunityCensus | null>(null)
  const [editingCommunityId, setEditingCommunityId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [communityToDelete, setCommunityToDelete] = useState<CommunityCensus | null>(null)
  
  // Form state - Remove old state management
  // const [editForm, setEditForm] = useState({...})
  // const [newCommunityForm, setNewCommunityForm] = useState({...})
  
  // React Hook Form setup
  const createForm = useForm({
    resolver: yupResolver(communitySchema),
    defaultValues: {
      name: '',
      population: 0,
      tier: 'Single' as 'Single' | 'Lower' | 'Upper',
      province: 'Ontario',
      region: '',
      census_year: new Date().getFullYear(),
    },
  })
  
  // UI state
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
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
      year: censusYearFilter !== 'all' ? parseInt(censusYearFilter) : undefined,
      tier: tierFilter !== 'all' ? tierFilter : undefined,
      region: regionFilter !== 'all' ? regionFilter : undefined,
      sort: sortOrder === -1 ? `-${sortBy}` : sortBy,
    }
  }, [page, pageSize, debouncedSearch, tierFilter, regionFilter, censusYearFilter, sortOrder, sortBy])

  // Fetch communities using React Query
  const { data: communitiesResponse, isLoading, error, refetch } = useCommunities(queryParams)

  // Fetch regions using React Query hook
  const { data: regionsData, isLoading: regionsLoading, error: regionsError } = useRegions()

  // Fetch single community for editing
  const { data: editingCommunityData, isLoading: editingCommunityLoading, error: editingCommunityError } = useCommunity(editingCommunityId || '', !!editingCommunityId)

  // Mutations
  const createMutation = useCreateCommunity()
  const updateMutation = useUpdateCommunity()
  const deleteMutation = useDeleteCommunity()

  // Extract data from response
  const communitiesData = useMemo(() => {
    return communitiesResponse || { count: 0, next: null, previous: null, results: [] }
  }, [communitiesResponse])

  const communities = communitiesData.results || []

  // Show success/error messages temporarily
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
    setEditingCommunityId(community.community)
    setEditingCommunity(community) // Keep for fallback if API fails
  }

  const onSubmitEdit = async (data: any) => {
    if (!editingCommunity) return

    try {
      // Transform data to match API format
      const apiData = {
        name: data.name,
        population: data.population,
        tier: data.tier,
        region: data.region,
        province: data.province,
        census_year: data.census_year,
      }

      await updateMutation.mutateAsync({
        id: editingCommunity.community,
        data: apiData,
      })

      setEditingCommunityId(null)
      setEditingCommunity(null)
      setSuccessMessage(`Community "${data.name}" updated successfully`)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update community')
    }
  }

  // This will be called by the EditCommunityForm component
  const handleSaveEdit = (data: any) => {
    onSubmitEdit(data)
  }

  const handleDeleteCommunity = (community: CommunityCensus) => {
    setCommunityToDelete(community)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteCommunity = async () => {
    if (!communityToDelete) return

    try {
      await deleteMutation.mutateAsync(communityToDelete.community)
      setSuccessMessage(`Community "${communityToDelete.community_name}" deleted successfully`)
      setIsDeleteDialogOpen(false)
      setCommunityToDelete(null)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete community')
    }
  }

  const onSubmitCreate = async (data: any) => {
    try {
      // Transform data to match API format
      const apiData = {
        name: data.name,
        population: data.population,
        tier: data.tier,
        region: data.region,
        province: data.province,
        census_year: data.census_year,
      }

      await createMutation.mutateAsync(apiData)

      setIsAddDialogOpen(false)
      createForm.reset()
      setSuccessMessage(`Community "${data.name}" added successfully`)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to add community')
    }
  }

  const handleAddCommunity = createForm.handleSubmit(onSubmitCreate)

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'Upper':
        return 'bg-blue-100 text-blue-800'
      case 'Lower':
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
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Community
            </Button>
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
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Upper">Upper Tier</SelectItem>
                <SelectItem value="Lower">Lower Tier</SelectItem>
                <SelectItem value="Single">Single Tier</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regionsData?.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <YearPicker
              value={censusYearFilter !== 'all' ? parseInt(censusYearFilter) : undefined}
              onChange={(year) => setCensusYearFilter(year.toString())}
              placeholder="Filter by census year"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('name')}>
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('population')}>
                      Population
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading communities...
                    </TableCell>
                  </TableRow>
                ) : communities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No communities found
                    </TableCell>
                  </TableRow>
                ) : (
                  communities.map((community) => (
                    <TableRow key={community.id}>
                      <TableCell className="font-medium">{community.community_name}</TableCell>
                      <TableCell>{community.population?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getTierBadgeColor(community.tier)}>
                          {community.tier || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{community.region || 'N/A'}</TableCell>
                      <TableCell>{community.province || 'N/A'}</TableCell>
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

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {communities.length} of {communitiesData.count} communities
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
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
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!communitiesData.previous || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const totalPages = Math.ceil(communitiesData.count / pageSize) || 1
                    const currentPage = page
                    const maxVisiblePages = 5
                    const halfVisible = Math.floor(maxVisiblePages / 2)

                    let startPage = Math.max(1, currentPage - halfVisible)
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

                    // Adjust start page if we're near the end
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1)
                    }

                    const pages = []
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(i)}
                          disabled={isLoading}
                          className="w-8 h-8 p-0"
                        >
                          {i}
                        </Button>
                      )
                    }

                    return pages
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!communitiesData.next || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingCommunityId} onOpenChange={(open) => {
        if (!open) {
          setEditingCommunityId(null)
          setEditingCommunity(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Community</DialogTitle>
            <DialogDescription>Update community information</DialogDescription>
          </DialogHeader>

          {editingCommunityLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading community data...</p>
              </div>
            </div>
          ) : editingCommunityError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Failed to load community data</p>
              <Button onClick={() => setEditingCommunityId(editingCommunityId)} variant="outline">
                Try Again
              </Button>
            </div>
          ) : editingCommunityData ? (
            <EditCommunityForm
              community={editingCommunityData}
              regions={regionsData || []}
              onSubmit={handleSaveEdit}
              loading={updateMutation.isPending}
              onCancel={() => {
                setEditingCommunityId(null)
                setEditingCommunity(null)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Community</DialogTitle>
            <DialogDescription>Create a new community entry</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCommunity} className="space-y-4">
            <div>
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                {...createForm.register('name')}
                className={createForm.formState.errors.name ? 'border-red-500' : ''}
              />
              {createForm.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="create-population">Population</Label>
              <Input
                id="create-population"
                type="number"
                {...createForm.register('population')}
                className={createForm.formState.errors.population ? 'border-red-500' : ''}
              />
              {createForm.formState.errors.population && (
                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.population.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="create-tier">Tier</Label>
              <Select
                value={createForm.watch('tier')}
                onValueChange={(value) => createForm.setValue('tier', value as 'Single' | 'Lower' | 'Upper')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upper">Upper Tier</SelectItem>
                  <SelectItem value="Lower">Lower Tier</SelectItem>
                  <SelectItem value="Single">Single Tier</SelectItem>
                </SelectContent>
              </Select>
              {createForm.formState.errors.tier && (
                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.tier.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="create-region">Region</Label>
              <Select
                value={createForm.watch('region')}
                onValueChange={(value) => createForm.setValue('region', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regionsData?.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.formState.errors.region && (
                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.region.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="create-province">Province</Label>
              <Input
                id="create-province"
                {...createForm.register('province')}
                className={createForm.formState.errors.province ? 'border-red-500' : ''}
              />
              {createForm.formState.errors.province && (
                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.province.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="create-census-year">Census Year</Label>
              <YearPicker
                value={createForm.watch('census_year')}
                onChange={(year) => createForm.setValue('census_year', year)}
                placeholder="Select census year"
              />
              {createForm.formState.errors.census_year && (
                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.census_year.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Community'}
              </Button>
            </DialogFooter>
          </form>
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