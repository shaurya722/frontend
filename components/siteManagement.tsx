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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
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
  Building2,
} from 'lucide-react'

import { useSites } from '@/features/sites/hooks'
import { SitesFilters } from '@/features/sites/types'
import { useCensusYears } from '@/features/communities/hooks'

import SiteFormDialog, { type CollectionSite } from './site-form-dialog'

export default function SiteManagement() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [siteType, setSiteType] = useState<string>('')
  const [year, setYear] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const limit = 10

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [selectedSite, setSelectedSite] = useState<CollectionSite | null>(null)

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
    status: status || undefined,
    site_type: siteType || undefined,
    year,
    page,
    limit,
  }), [debouncedSearch, status, siteType, year, page])

  const { data, isLoading, error } = useSites(filters)

  const totalSites = data?.count || 0
  const activeSites = data?.results.filter(site => site.is_active).length || 0
  const inactiveSites = totalSites - activeSites
  const scheduledSites = data?.results.filter(site => site.site_start_date && new Date(site.site_start_date) > new Date()).length || 0
  const totalPages = Math.ceil(totalSites / limit)

  // Dialog handlers
  const handleAddSite = () => {
    setDialogMode('add')
    setSelectedSite(null)
    setIsDialogOpen(true)
  }

  const handleEditSite = (site: any) => {
    // Transform site data to match CollectionSite interface
    const collectionSite: CollectionSite = {
      id: site.id,
      name: site.site_name,
      service_partner: site.service_partner || '',
      site_type: site.site_type,
      operator_type: site.operator_type,
      address: site.address || '',
      municipality_id: site.community_id || '',
      status: site.is_active ? 'Active' : 'Inactive',
      address_line1: site.address_line1 || '',
      address_line2: site.address_line2 || '',
      city: site.address_city || '',
      state_province: site.address_province || '',
      postal_code: site.address_postal_code || '',
      community: site.community_name || '',
      region_district: site.region || '',
      service_area: site.service_area,
      latitude: site.latitude,
      longitude: site.longitude,
      active_dates: site.site_start_date || '',
      programs: [], // Map from site data
      materials_collected: [], // Map from site data
      collection_scope: [], // Map from site data
    }

    // Map programs
    if (site.program_paint) collectionSite.programs.push('Paint')
    if (site.program_lights) collectionSite.programs.push('Lights')
    if (site.program_solvents) collectionSite.programs.push('Solvents')
    if (site.program_pesticides) collectionSite.programs.push('Pesticides')
    if (site.program_fertilizers) collectionSite.programs.push('Fertilizers')

    setDialogMode('edit')
    setSelectedSite(collectionSite)
    setIsDialogOpen(true)
  }

  const handleSiteSubmit = async (siteData: CollectionSite) => {
    try {
      if (dialogMode === 'add') {
        // TODO: Implement create site mutation
        console.log('Creating site:', siteData)
        // await createSiteMutation.mutateAsync(siteData)
      } else {
        // TODO: Implement update site mutation
        console.log('Updating site:', siteData)
        // await updateSiteMutation.mutateAsync(siteData)
      }
      setIsDialogOpen(false)
      setSelectedSite(null)
      // TODO: Show success message and refetch data
    } catch (error) {
      console.error('Error saving site:', error)
      // TODO: Show error message
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedSite(null)
  }

  return (
    <div className='space-y-6'>
      {/* Search & Filters */}
      <Card>
        <CardContent className='pt-6 space-y-4'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-3'>
            <CardTitle className='text-lg'>Search & Filters</CardTitle>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
              >
                <Upload className='w-4 h-4 mr-2' />
                Import CSV
              </Button>
              <Button
                variant='outline'
                size='sm'
              >
                <Download className='w-4 h-4 mr-2' />
                Export
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
              </div>
            </div>
            <div className='flex gap-2'>
              <div>
                <Label htmlFor='status'>Status</Label>
                <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Active'>Active</SelectItem>
                    <SelectItem value='Inactive'>Inactive</SelectItem>
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
                    <SelectItem value='Other'>Other</SelectItem>
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
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Settings2 className='w-4 h-4 mr-2' />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
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
                              <Button variant='ghost' size='sm' onClick={() => handleEditSite(site)}>
                                <Edit className='w-4 h-4' />
                              </Button>
                              <Button variant='ghost' size='sm'>
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
              {totalPages > 1 && (
                <div className='flex justify-center mt-4'>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(Math.max(1, page - 1))}
                          className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            onClick={() => setPage(p)}
                            isActive={p === page}
                            className='cursor-pointer'
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
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
        isLoading={false} // TODO: Connect to actual loading state
      />
    </div>
  )
}