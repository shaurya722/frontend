'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GitBranch,
  ArrowRight,
  Info,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAdjacentReallocations, createReallocationRequest } from '@/lib/api'

// Interface matching backend response
interface EligibleSite {
  id: string
  name: string
  operator_type: string
  address: string
}

interface AdjacentWithShortfall {
  id: string
  name: string
  shortfall: number
  reallocations: any[]
  total_reallocated: number
}

interface ExcessCommunity {
  id: string
  name: string
  eligibleExcess: number
  eligibleSites: EligibleSite[]
  adjacentWithShortfalls: AdjacentWithShortfall[]
}

export default function ToolCAdjacentReallocation() {
  const [excessCommunities, setExcessCommunities] = useState<ExcessCommunity[]>(
    [],
  )
  const [selectedProgram, setSelectedProgram] = useState<string>('Paint')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<{
    communities_with_excess: number
    total_eligible_excess: number
    total_adjacent_shortfalls: number
  } | null>(null)

  // Pagination, search & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [ordering, setOrdering] = useState('name')

  // Dialog state
  const [isReallocationDialogOpen, setIsReallocationDialogOpen] =
    useState(false)
  const [selectedExcessCommunity, setSelectedExcessCommunity] =
    useState<ExcessCommunity | null>(null)
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [targetCommunity, setTargetCommunity] = useState<string>('')

  const programs = ['Paint', 'Pesticides', 'Solvents', 'Lighting']

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch data from backend API
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getAdjacentReallocations({
        program: selectedProgram,
        search: debouncedSearch || undefined,
        page,
        limit: pageSize,
        ordering,
      })

      if (
        response.data &&
        (response.data.results || response.data.communities)
      ) {
        // Transform backend data to frontend format (use paginated results if available)
        const sourceData = response.data.results || response.data.communities
        const transformed: ExcessCommunity[] = sourceData.map((c: any) => ({
          id: c.id,
          name: c.name,
          eligibleExcess: c.eligible_excess,
          eligibleSites: c.eligible_sites || [],
          adjacentWithShortfalls: c.adjacent_with_shortfalls || [],
        }))

        setExcessCommunities(transformed)
        setSummary(response.data.summary)
        setTotalPages(response.data.totalPages || 1)
        setTotalCount(response.data.totalDocs || transformed.length)
      } else {
        setExcessCommunities([])
        setSummary(null)
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Error fetching adjacent reallocation data:', error)
      setExcessCommunities([])
      setSummary(null)
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [selectedProgram, debouncedSearch, page, pageSize, ordering])

  // Handle sorting
  const handleSort = (field: string) => {
    if (ordering === field) {
      setOrdering(`-${field}`)
    } else if (ordering === `-${field}`) {
      setOrdering(field)
    } else {
      setOrdering(field)
    }
    setPage(1)
  }

  const getSortIcon = (field: string) => {
    if (ordering === field) return '↑'
    if (ordering === `-${field}`) return '↓'
    return ''
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle opening reallocation dialog
  const handleOpenReallocationDialog = (community: ExcessCommunity) => {
    setSelectedExcessCommunity(community)
    setSelectedSites([])
    setTargetCommunity('')
    setIsReallocationDialogOpen(true)
  }

  // Handle site selection
  const handleSiteToggle = (siteId: string) => {
    setSelectedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId],
    )
  }

  // Handle reallocation using new backend API
  const handleReallocate = async () => {
    if (
      !selectedExcessCommunity ||
      selectedSites.length === 0 ||
      !targetCommunity
    )
      return

    try {
      const targetComm = selectedExcessCommunity.adjacentWithShortfalls.find(
        (a) => a.id === targetCommunity,
      )

      // Create reallocation records using the new API
      for (const siteId of selectedSites) {
        await createReallocationRequest({
          site: siteId,
          from_municipality: selectedExcessCommunity.id,
          to_municipality: targetCommunity,
          program: selectedProgram,
          reallocation_type: 'site',
          percentage: 100,
          rationale: `Adjacent community reallocation from ${selectedExcessCommunity.name} to ${targetComm?.name}`,
        })
      }

      // Refresh data from backend to get updated state
      await fetchData()

      setIsReallocationDialogOpen(false)
      setSelectedExcessCommunity(null)
      setSelectedSites([])
      setTargetCommunity('')
    } catch (error) {
      console.error('Error reallocating:', error)
    }
  }

  return (
    <div className='space-y-6'>
      {/* <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitBranch className="w-5 h-5" />
                        Adjacent Community Reallocation
                    </CardTitle>
                    <CardDescription>
                        Reallocate excess collection sites to adjacent communities with shortfalls. Only eligible sites can be
                        reallocated (excludes Municipal, First Nation/Indigenous, and Regional District operators, and Event site
                        types).
                    </CardDescription>
                </CardHeader>
            </Card> */}

      {/* Info Alert */}
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription>
          <strong>Eligibility Rules:</strong> Sites can only be reallocated if:
          <ul className='list-disc list-inside mt-1 text-sm'>
            <li>Site type is "Collection Site" (not Event)</li>
            <li>
              Operator type is Retailer, Distributor, Private Depot, Product
              Care, or Other
            </li>
            <li>
              The destination community directly borders the source community
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-row gap-4'>
            {/* Search */}
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search by community name...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            {/* Program Filter */}
            <div className='flex items-center gap-2 [&_button]:md:w-full shrink-0'>
              <Label className='text-sm whitespace-nowrap'>Program</Label>
              <Select
                value={selectedProgram}
                onValueChange={(v) => {
                  setSelectedProgram(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Excess Communities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Communities with Eligible Excess Sites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='text-center py-8'>Loading...</div>
          ) : excessCommunities.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <CheckCircle className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p>No communities with eligible excess sites to reallocate</p>
            </div>
          ) : (
            <div className='overflow-x-auto -mx-4 sm:mx-0'>
              <div className='inline-block min-w-full align-middle px-4 sm:px-0'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('name')}
                      >
                        <div className='flex items-center gap-1'>
                          Community
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>{getSortIcon('name')}</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className='text-right cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('eligible_excess')}
                      >
                        <div className='flex items-center justify-end gap-1'>
                          Eligible Excess
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('eligible_excess')}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('adjacent_shortfalls')}
                      >
                        <div className='flex items-center gap-1'>
                          Adjacent with Shortfalls
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('adjacent_shortfalls')}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead className='cursor-pointer hover:bg-muted/50 bg-gray-50'>
                        Adjacent Reallocation
                      </TableHead>
                      <TableHead className='text-center cursor-pointer hover:bg-muted/50 bg-gray-50'>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excessCommunities.map((community) => (
                      <TableRow key={community.id}>
                        <TableCell className='font-medium'>
                          {community.name}
                        </TableCell>
                        <TableCell className='text-right'>
                          <Badge
                            variant='outline'
                            className='bg-blue-50 text-blue-700'
                          >
                            {community.eligibleExcess}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {community.adjacentWithShortfalls.length === 0 ? (
                            <span className='text-muted-foreground'>N/A</span>
                          ) : (
                            <div className='flex flex-wrap gap-1'>
                              {community.adjacentWithShortfalls.map((adj) => (
                                <Badge
                                  key={adj.id}
                                  variant='destructive'
                                  className='text-xs'
                                >
                                  {adj.name} – {adj.shortfall}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {community.adjacentWithShortfalls.length === 0 ? (
                            <span className='text-muted-foreground'>N/A</span>
                          ) : (
                            <div className='flex flex-wrap gap-1'>
                              {community.adjacentWithShortfalls
                                .filter((adj) => adj.total_reallocated > 0)
                                .map((adj) => (
                                  <Badge
                                    key={adj.id}
                                    variant='secondary'
                                    className='text-xs bg-green-100 text-green-700'
                                  >
                                    {adj.name} – {adj.total_reallocated}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className='text-center'>
                          <Button
                            size='sm'
                            onClick={() =>
                              handleOpenReallocationDialog(community)
                            }
                            disabled={
                              community.adjacentWithShortfalls.length === 0
                            }
                          >
                            Reallocate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4 pt-4 border-t gap-4'>
              <div className='text-sm text-muted-foreground'>
                Page {page} of {totalPages} ({totalCount} total)
              </div>
              {/* Page Size */}
              <div className='flex items-center gap-2'>
                <Label className='text-sm whitespace-nowrap'>Per Page</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className='w-20'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='10'>10</SelectItem>
                    <SelectItem value='20'>20</SelectItem>
                    <SelectItem value='50'>50</SelectItem>
                    <SelectItem value='100'>100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                  <ChevronLeft className='h-4 w-4 -ml-2' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className='h-4 w-4' />
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
                      variant={p === currentPage ? 'default' : 'outline'}
                      size='sm'
                      className='w-9'
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))
                })()}

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className='h-4 w-4' />
                  <ChevronRight className='h-4 w-4 -ml-2' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reallocation Dialog */}
      <Dialog
        open={isReallocationDialogOpen}
        onOpenChange={setIsReallocationDialogOpen}
      >
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              Reallocate Sites from {selectedExcessCommunity?.name}
            </DialogTitle>
            <DialogDescription>
              Select sites to reallocate and choose a destination community.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Target Community Selection */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                Destination Community
              </label>
              <Select
                value={targetCommunity}
                onValueChange={setTargetCommunity}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select adjacent community with shortfall' />
                </SelectTrigger>
                <SelectContent>
                  {selectedExcessCommunity?.adjacentWithShortfalls.map(
                    (adj) => (
                      <SelectItem key={adj.id} value={adj.id}>
                        {adj.name} (Shortfall: {adj.shortfall})
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Site Selection */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                Select Sites to Reallocate
              </label>
              <div className='max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2'>
                {selectedExcessCommunity?.eligibleSites.map((site) => (
                  <div
                    key={site.id}
                    className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer'
                    onClick={() => handleSiteToggle(site.id)}
                  >
                    <Checkbox
                      checked={selectedSites.includes(site.id)}
                      onCheckedChange={() => handleSiteToggle(site.id)}
                    />
                    <div className='flex-1'>
                      <div className='font-medium'>{site.name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {site.operator_type || 'Unknown'} • {site.address}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSites.length > 0 && targetCommunity && (
              <Alert>
                <ArrowRight className='h-4 w-4' />
                <AlertDescription>
                  {selectedSites.length} site(s) will be reallocated from{' '}
                  <strong>{selectedExcessCommunity?.name}</strong> to{' '}
                  <strong>
                    {
                      selectedExcessCommunity?.adjacentWithShortfalls.find(
                        (a) => a.id === targetCommunity,
                      )?.name
                    }
                  </strong>
                  .
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsReallocationDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReallocate}
              disabled={selectedSites.length === 0 || !targetCommunity}
            >
              Reallocate {selectedSites.length} Site(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
