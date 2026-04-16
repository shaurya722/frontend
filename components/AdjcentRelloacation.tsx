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
import { Info, ArrowRight, Loader2, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  useAdjacentAllocations,
  useAllocateAdjacent,
  usePatchAdjacentAllocation,
} from '@/hooks/useAdjacentAllocations'
import { useCensusYears } from '@/hooks/useCensusYears'
import type { AdjacentCommunityUi, AdjacentShortfallUi } from '@/features/adjacent-allocations/types'

const PAGE_SIZE = 20

const PROGRAMS = [
  'Paint',
  'Lighting',
  'Solvents',
  'Pesticides',
  'Fertilizers',
] as const

export default function AdjacentReallocation() {
  const { toast } = useToast()
  const { data: censusYearsData } = useCensusYears()

  const [search, setSearch] = useState('')
  const [program, setProgram] = useState<string>('Paint')
  const [censusYear, setCensusYear] = useState('2050')
  const [page, setPage] = useState(1)

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
      limit: PAGE_SIZE,
    }),
    [program, censusYear, page],
  )

  const {
    data: listData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdjacentAllocations(listParams)

  const allocateMutation = useAllocateAdjacent()
  const patchMutation = usePatchAdjacentAllocation()

  const rows = listData?.rows ?? []
  const total = listData?.total ?? 0
  const totalPages =
    listData?.totalPages ??
    Math.max(1, Math.ceil(total / PAGE_SIZE) || 1)
  const summary = listData?.summary
  const apiCensusYear = listData?.censusYear

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

  const [patchOpen, setPatchOpen] = useState(false)
  const [patchContext, setPatchContext] = useState<{
    reallocationId: string
    fromCommunity: AdjacentCommunityUi
    adjacent: AdjacentShortfallUi
  } | null>(null)
  const [patchNewTargetId, setPatchNewTargetId] = useState('')
  const [patchReason, setPatchReason] = useState(
    'Corrected adjacent allocation',
  )

  const handleOpenAllocate = (community: AdjacentCommunityUi) => {
    setSelectedCommunity(community)
    setSelectedSiteCensusIds([])
    setTargetCommunityId('')
    setAllocateReason('Adjacent reallocation')
    setAllocateOpen(true)
  }

  const handleOpenPatch = (
    fromCommunity: AdjacentCommunityUi,
    adjacent: AdjacentShortfallUi,
  ) => {
    if (!adjacent.reallocation_id) return
    setPatchContext({
      reallocationId: adjacent.reallocation_id,
      fromCommunity,
      adjacent,
    })
    setPatchNewTargetId('')
    setPatchReason('Corrected adjacent allocation')
    setPatchOpen(true)
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

  const handleConfirmPatch = async () => {
    if (!patchContext || !patchNewTargetId) {
      toast({
        title: 'Missing target',
        description: 'Choose a new target community.',
        variant: 'destructive',
      })
      return
    }
    try {
      await patchMutation.mutateAsync({
        reallocation_id: patchContext.reallocationId,
        new_to_community_id: patchNewTargetId,
        program,
        reason: patchReason.trim() || 'Corrected adjacent allocation',
      })
      toast({ title: 'Allocation updated', description: 'PATCH applied.' })
      setPatchOpen(false)
      setPatchContext(null)
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Update failed'
      toast({
        title: 'Request failed',
        description: message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Data from{' '}
          <code className="text-xs">
            GET /api/compliance/adjacent-allocations/
          </code>{' '}
          (query: <code className="text-xs">program</code>,{' '}
          <code className="text-xs">year</code>, page, limit). Allocate via{' '}
          <code className="text-xs">POST …/allocate/</code>, correct via{' '}
          <code className="text-xs">PATCH …/allocate/</code>.
        </AlertDescription>
      </Alert>

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Summary</CardTitle>
            <CardDescription>
              From API <code className="text-xs">summary</code>
              {apiCensusYear ? (
                <>
                  {' '}
                  · census year{' '}
                  <strong>{apiCensusYear.year}</strong>
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Communities</p>
                <p className="font-semibold">{summary.total_communities ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">With shortfall</p>
                <p className="font-semibold">
                  {summary.communities_with_shortfall ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">With excess</p>
                <p className="font-semibold">
                  {summary.communities_with_excess ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total shortfall</p>
                <p className="font-semibold">{summary.total_shortfall ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total excess</p>
                <p className="font-semibold">{summary.total_excess ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>Communities</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </span>
            ) : (
              <>
                <span>
                  {total} total · page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Community</TableHead>
                <TableHead className="min-w-[200px] max-w-[320px]">
                  Adjacent communities
                </TableHead>
                <TableHead className="min-w-[160px] whitespace-nowrap">
                  Allocations (this community)
                </TableHead>
                <TableHead className="text-right w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No rows match filters or the API returned an empty list.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="align-top">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        req {c.required} · act {c.actual} · shortfall{' '}
                        <span className="text-foreground font-medium">
                          {c.shortfall}
                        </span>
                        {c.excess ? (
                          <span> · excess {c.excess}</span>
                        ) : null}
                      </div>
                      <div className="text-xs mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-muted-foreground">Eligible excess</span>
                        <Badge variant="secondary" className="text-xs">
                          {c.eligibleExcess}
                        </Badge>
                        <span className="text-muted-foreground">
                          · {c.eligibleSites.length} site
                          {c.eligibleSites.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top max-w-[340px]">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        {c.adjacentCount} adjacent
                        {c.adjacentWithShortfalls.length !== c.adjacentCount
                          ? ` · ${c.adjacentWithShortfalls.length} in payload`
                          : ''}
                      </div>
                      {c.adjacentWithShortfalls.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <ul className="space-y-2 text-xs">
                          {c.adjacentWithShortfalls.map((a) => (
                            <li
                              key={a.id}
                              className="rounded-md border bg-muted/30 px-2 py-1.5"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-medium">{a.name}</span>
                                {a.reallocation_id ? (
                                  <button
                                    type="button"
                                    className="shrink-0 rounded p-0.5 hover:bg-muted"
                                    title="PATCH allocation"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenPatch(c, a)
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                ) : null}
                              </div>
                              <div className="text-muted-foreground mt-0.5">
                                shortfall {a.shortfall} · req {a.required} / act{' '}
                                {a.actual}
                                {a.excess ? (
                                  <span> · excess {a.excess}</span>
                                ) : null}
                              </div>
                              <div className="mt-1 grid grid-cols-1 gap-0.5 text-[11px] leading-tight">
                                <span>
                                  <span className="text-muted-foreground">
                                    Into adjacent:
                                  </span>{' '}
                                  <strong>{a.totalAllocatedTo}</strong> sites
                                  <span className="text-muted-foreground">
                                    {' '}
                                    ({a.allocatedToCount} record
                                    {a.allocatedToCount === 1 ? '' : 's'})
                                  </span>
                                </span>
                                <span>
                                  <span className="text-muted-foreground">
                                    From adjacent:
                                  </span>{' '}
                                  <strong>{a.totalAllocatedFrom}</strong> sites
                                  <span className="text-muted-foreground">
                                    {' '}
                                    ({a.allocatedFromCount} record
                                    {a.allocatedFromCount === 1 ? '' : 's'})
                                  </span>
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-xs">
                      <div>
                        <span className="text-muted-foreground">Out</span>:{' '}
                        <strong>{c.totalAllocatedOut}</strong> sites
                        <span className="text-muted-foreground">
                          {' '}
                          ({c.allocatedOutCount} record
                          {c.allocatedOutCount === 1 ? '' : 's'})
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-muted-foreground">In</span>:{' '}
                        <strong>{c.totalAllocatedIn}</strong> sites
                        <span className="text-muted-foreground">
                          {' '}
                          ({c.allocatedInCount} record
                          {c.allocatedInCount === 1 ? '' : 's'})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <Button
                        size="sm"
                        onClick={() => handleOpenAllocate(c)}
                        disabled={c.eligibleSites.length === 0}
                      >
                        Reallocate
                      </Button>
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

      <Dialog open={patchOpen} onOpenChange={setPatchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Correct adjacent allocation</DialogTitle>
            <DialogDescription>
              PATCH with <code className="text-xs">reallocation_id</code>,{' '}
              <code className="text-xs">new_to_community_id</code>, program, reason.
            </DialogDescription>
          </DialogHeader>

          {patchContext && (
            <>
              <p className="text-sm text-muted-foreground">
                From <strong>{patchContext.fromCommunity.name}</strong> · current
                target <strong>{patchContext.adjacent.name}</strong>
              </p>
              <p className="text-xs font-mono break-all text-muted-foreground">
                reallocation_id: {patchContext.reallocationId}
              </p>

              <div className="space-y-2">
                <Label>New target community</Label>
                <Select
                  value={patchNewTargetId}
                  onValueChange={setPatchNewTargetId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new target" />
                  </SelectTrigger>
                  <SelectContent>
                    {patchContext.fromCommunity.adjacentWithShortfalls.map(
                      (a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                          {a.id === patchContext.adjacent.id
                            ? ' (current target)'
                            : ''}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patch-reason">Reason</Label>
                <Textarea
                  id="patch-reason"
                  value={patchReason}
                  onChange={(e) => setPatchReason(e.target.value)}
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPatchOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleConfirmPatch()}
                  disabled={patchMutation.isPending || !patchNewTargetId}
                >
                  {patchMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating…
                    </>
                  ) : (
                    'Update allocation'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
