'use client'

import { useEffect, useMemo, useState } from 'react'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Info, ArrowRight, Loader2, ChevronLeft, ChevronRight, Eye, Building2, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PaginationControls } from '@/components/pagination-controls'
import {
  useAdjacentAllocations,
  useAdjacentAllocation,
  useAllocateAdjacent,
} from '@/hooks/useAdjacentAllocations'
import { useCensusYears } from '@/hooks/useCensusYears'
import type { AdjacentCommunityUi, AdjacentShortfallUi } from '@/features/adjacent-allocations/types'

const DEFAULT_PAGE_SIZE = 20

const PROGRAMS = [
  'Paint',
  'Lighting',
  'Solvents',
  'Pesticides',
  'Fertilizers',
] as const

export default function AdjacentReallocation() {
  const { toast } = useToast()
  const { data: censusYearsData, isSuccess: censusYearsLoaded } = useCensusYears()

  const [search, setSearch] = useState('')
  const [program, setProgram] = useState<string>('Paint')
  const [censusYear, setCensusYear] = useState('2050')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const censusYearOptions = useMemo(() => {
    const fromApi =
      censusYearsData?.years?.map((y) => y.year).sort((a, b) => b - a) ?? []
    if (fromApi.length > 0) return fromApi
    return [2050, 2035, 2024, 2023, 2022, 2021]
  }, [censusYearsData])

  useEffect(() => {
    if (censusYearOptions.length === 0) return
    const y = parseInt(censusYear, 10)
    if (Number.isFinite(y) && censusYearOptions.includes(y)) return
    setCensusYear(String(censusYearOptions[0]))
  }, [censusYearOptions, censusYear])

  const listParams = useMemo(
    () => ({
      program,
      year: parseInt(censusYear, 10) || 2050,
      page,
      limit: pageSize,
    }),
    [program, censusYear, page, pageSize],
  )

  const {
    data: listData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdjacentAllocations(listParams, censusYearsLoaded)

  const allocateMutation = useAllocateAdjacent()

  const rows = listData?.rows ?? []
  const total = listData?.total ?? 0
  const totalPages =
    listData?.totalPages ??
    Math.max(1, Math.ceil(total / pageSize) || 1)
  const currentPage = listData?.page ?? page
  const hasNext = listData?.hasNext ?? currentPage < totalPages
  const hasPrev = listData?.hasPrev ?? currentPage > 1
  const summary = listData?.summary

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true
      return c.adjacentWithShortfalls.some((a) =>
        a.name.toLowerCase().includes(q),
      )
    })
  }, [rows, search])

  const [allocateOpen, setAllocateOpen] = useState(false)
  const [selectedCommunity, setSelectedCommunity] =
    useState<AdjacentCommunityUi | null>(null)
  const [selectedSiteCensusIds, setSelectedSiteCensusIds] = useState<
    number[]
  >([])
  const [targetCommunityId, setTargetCommunityId] = useState('')
  const [allocateReason, setAllocateReason] = useState('Adjacent reallocation')

  const [viewOpen, setViewOpen] = useState(false)
  const [viewContext, setViewContext] = useState<{
    reallocationId: string
    fromCommunity: AdjacentCommunityUi
    adjacent: AdjacentShortfallUi
  } | null>(null)

  // Fetch allocation details when view dialog is open
  const { data: allocationDetails, isLoading: allocationDetailsLoading } =
    useAdjacentAllocation(viewContext?.reallocationId ?? null)

  const handleOpenAllocate = (community: AdjacentCommunityUi) => {
    setSelectedCommunity(community)
    setSelectedSiteCensusIds([])
    setTargetCommunityId('')
    setAllocateReason('Adjacent reallocation')
    setAllocateOpen(true)
  }

  const handleOpenView = (
    fromCommunity: AdjacentCommunityUi,
    adjacent: AdjacentShortfallUi,
    reallocationId: string,
  ) => {
    setViewContext({
      reallocationId,
      fromCommunity,
      adjacent,
    })
    setViewOpen(true)
  }

  const toggleSite = (censusId: number) => {
    setSelectedSiteCensusIds((prev) =>
      prev.includes(censusId)
        ? prev.filter((i) => i !== censusId)
        : [...prev, censusId],
    )
  }

  const handleConfirmAllocate = async () => {
    if (
      !selectedCommunity ||
      !targetCommunityId ||
      selectedSiteCensusIds.length === 0
    ) {
      toast({
        title: 'Missing fields',
        description:
          'Select at least one site, a target community, and confirm.',
        variant: 'destructive',
      })
      return
    }
    try {
      await allocateMutation.mutateAsync({
        site_census_ids: selectedSiteCensusIds,
        to_community_id: targetCommunityId,
        program,
        reason: allocateReason.trim() || 'Adjacent reallocation',
      })
      toast({
        title: 'Allocation created',
        description: `${selectedSiteCensusIds.length} site(s) → target community.`,
      })
      setAllocateOpen(false)
      setSelectedCommunity(null)
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Allocation failed'
      toast({
        title: 'Request failed',
        description: message,
        variant: 'destructive',
      })
    }
  }


  return (
    <div className="space-y-6">

      {isError && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {(error as Error)?.message ?? 'Failed to load adjacent allocations.'}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px] space-y-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              placeholder="Filter by community or adjacent name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1 w-40">
            <Label className="text-xs text-muted-foreground">Census year</Label>
            <Select
              value={censusYear}
              onValueChange={(v) => {
                setCensusYear(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {censusYearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-44">
            <Label className="text-xs text-muted-foreground">Program</Label>
            <Select value={program} onValueChange={(v) => { setProgram(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Communities</CardTitle>
              <Building2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.total_communities ?? '—'}</div>
              <p className='text-xs text-muted-foreground'>Total communities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>With Shortfall</CardTitle>
              <TrendingDown className='h-4 w-4 text-red-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>{summary.communities_with_shortfall ?? '—'}</div>
              <p className='text-xs text-muted-foreground'>Communities needing allocation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>With Excess</CardTitle>
              <TrendingUp className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>{summary.communities_with_excess ?? '—'}</div>
              <p className='text-xs text-muted-foreground'>Communities with surplus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Shortfall</CardTitle>
              <AlertCircle className='h-4 w-4 text-orange-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-orange-600'>{summary.total_shortfall ?? '—'}</div>
              <p className='text-xs text-muted-foreground'>Sites needed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Excess</CardTitle>
              <CheckCircle2 className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-600'>{summary.total_excess ?? '—'}</div>
              <p className='text-xs text-muted-foreground'>Sites available</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Communities with Eligible Excess Sites</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Community</TableHead>
                <TableHead className="min-w-[80px] text-center">
                  Eligible Excess
                </TableHead>
                <TableHead className="min-w-[280px]">
                  Adjacent with Shortfalls
                </TableHead>
                <TableHead className="min-w-[160px]">
                  Adjacent Reallocation
                </TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No rows match filters or the API returned an empty list.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="align-middle">
                      <div className="font-medium">{c.name}</div>
                    </TableCell>
                    <TableCell className="text-center align-middle">
                      {c.eligibleExcess > 0 ? (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                          {c.eligibleExcess}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{c.eligibleExcess}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="align-middle">
                      {c.adjacentWithShortfalls.length === 0 ? (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {c.adjacentWithShortfalls.map((a) => (
                            <Badge
                              key={a.id}
                              className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-xs"
                            >
                              {a.name} – {a.shortfall}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-middle">
                      {c.allocatedOut.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {c.adjacentWithShortfalls.length === 0 ? 'N/A' : '—'}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const targetCommunities = new Map<string, number>()
                            c.allocatedOut.forEach((alloc) => {
                              const name = alloc.toCommunity || 'Unknown'
                              targetCommunities.set(name, (targetCommunities.get(name) || 0) + 1)
                            })
                            return Array.from(targetCommunities.entries()).map(([name, count]) => (
                              <Badge
                                key={name}
                                className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs"
                              >
                                {name} – {count}
                              </Badge>
                            ))
                          })()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        {c.allocatedOut.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Open view dialog with first allocation
                              const firstAlloc = c.allocatedOut[0]
                              // Find the adjacent community that matches the allocation's toCommunity
                              const targetAdjacent = c.adjacentWithShortfalls.find(
                                a => a.name === firstAlloc.toCommunity || a.id === firstAlloc.toCommunityId
                              ) || c.adjacentWithShortfalls[0]
                              // Use the allocation's id as the reallocation_id
                              if (firstAlloc.id) {
                                handleOpenView(c, targetAdjacent, firstAlloc.id)
                              }
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleOpenAllocate(c)}
                          disabled={c.eligibleSites.length === 0 || c.adjacentWithShortfalls.length === 0}
                        >
                          Reallocate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {search.trim() && (
            <p className="text-xs text-muted-foreground mt-2">
              Client-side filter: {filteredRows.length} of {rows.length} on this page.
            </p>
          )}

          <PaginationControls
            page={currentPage}
            pageSize={pageSize}
            totalCount={total}
            currentCount={filteredRows.length}
            onPageChange={(newPage) => setPage(newPage)}
            isLoading={isLoading}
            hasNext={hasNext}
            hasPrev={hasPrev}
            label="communities"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Reallocate from {selectedCommunity?.name ?? '—'}
            </DialogTitle>
            <DialogDescription>
              POST{' '}
              <code className="text-xs">site_census_ids</code>,{' '}
              <code className="text-xs">to_community_id</code>, program, reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Target community</Label>
            <Select
              value={targetCommunityId}
              onValueChange={setTargetCommunityId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select adjacent with shortfall" />
              </SelectTrigger>
              <SelectContent>
                {selectedCommunity?.adjacentWithShortfalls.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} (shortfall {a.shortfall})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sites (site census id)</Label>
            <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
              {selectedCommunity?.eligibleSites.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                  No eligible sites in API payload for this community.
                </p>
              ) : (
                selectedCommunity?.eligibleSites.map((s) => (
                  <button
                    key={s.displayId}
                    type="button"
                    className="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-muted"
                    onClick={() => toggleSite(s.siteCensusId)}
                  >
                    <Checkbox
                      checked={selectedSiteCensusIds.includes(s.siteCensusId)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        census #{s.siteCensusId}
                      </div>
                      {s.address ? (
                        <div className="text-xs text-muted-foreground truncate">
                          {s.address}
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allocate-reason">Reason</Label>
            <Textarea
              id="allocate-reason"
              value={allocateReason}
              onChange={(e) => setAllocateReason(e.target.value)}
              rows={2}
            />
          </div>

          {selectedSiteCensusIds.length > 0 && targetCommunityId ? (
            <Alert>
              <ArrowRight className="h-4 w-4" />
              <AlertDescription>
                {selectedSiteCensusIds.length} site(s) →{' '}
                {selectedCommunity?.adjacentWithShortfalls.find(
                  (x) => x.id === targetCommunityId,
                )?.name ?? targetCommunityId}
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleConfirmAllocate()}
              disabled={
                allocateMutation.isPending ||
                !targetCommunityId ||
                selectedSiteCensusIds.length === 0
              }
            >
              {allocateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting…
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Allocation Details</DialogTitle>
          </DialogHeader>

          {viewContext && (
            <>
              {/* Allocation Details from GET by ID */}
              {allocationDetailsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading allocation details…
                </div>
              ) : allocationDetails ? (
                <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                  <p className="text-sm font-medium">Current Allocation Details</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="text-foreground">Site:</span>{' '}
                      {(allocationDetails as { site_name?: string })?.site_name ?? '—'}
                    </p>
                    <p>
                      <span className="text-foreground">From:</span>{' '}
                      {(() => {
                        const fc = (allocationDetails as { from_community?: unknown })?.from_community
                        if (typeof fc === 'string') return fc
                        if (fc && typeof fc === 'object') return (fc as { name?: string }).name ?? '—'
                        return viewContext.fromCommunity.name
                      })()}
                    </p>
                    <p>
                      <span className="text-foreground">To:</span>{' '}
                      {(() => {
                        const tc = (allocationDetails as { to_community?: unknown })?.to_community
                        if (typeof tc === 'string') return tc
                        if (tc && typeof tc === 'object') return (tc as { name?: string }).name ?? '—'
                        return viewContext.adjacent.name
                      })()}
                    </p>
                    <p>
                      <span className="text-foreground">Reallocated:</span>{' '}
                      {(allocationDetails as { reallocated_at?: string })?.reallocated_at
                        ? new Date((allocationDetails as { reallocated_at: string }).reallocated_at).toLocaleString()
                        : '—'}
                    </p>
                    <p>
                      <span className="text-foreground">Reason:</span>{' '}
                      {(allocationDetails as { reason?: string })?.reason ?? '—'}
                    </p>
                  </div>
                </div>
              ) : null}

              <p className="text-sm text-muted-foreground">
                From <strong>{viewContext.fromCommunity.name}</strong> · current
                target <strong>{viewContext.adjacent.name}</strong>
              </p>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
