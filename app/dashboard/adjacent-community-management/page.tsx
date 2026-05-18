'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
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
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { PaginationControls } from '@/components/pagination-controls'
import {
  useBaseCommunities,
  useBaseCommunity,
  useCreateBaseCommunity,
  useUpdateBaseCommunity,
  useDeleteBaseCommunity,
  useInfiniteBaseCommunitiesPicker,
  type BaseCommunity,
  type CreateBaseCommunityPayload,
} from '@/features/base-communities'
import { Textarea } from '@/components/ui/textarea'

export default function BaseCommunitiesPage() {
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sort state — same pattern as AdjcentRelloacation / communities-management
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1)
  const [sortBy, setSortBy] = useState('created_at')

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 1 ? -1 : 1)
    } else {
      setSortBy(field)
      setSortOrder(-1)
    }
    setPage(1)
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [communityToDelete, setCommunityToDelete] = useState<BaseCommunity | null>(null)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    boundary: '',
    adjacent_ids: '',
  })
  // For picking adjacent communities via a list
  const [selectedAdjacentIds, setSelectedAdjacentIds] = useState<string[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    page,
    limit: pageSize,
    sort: sortOrder === -1 ? `-${sortBy}` : sortBy,
  }), [debouncedSearch, page, pageSize, sortBy, sortOrder])

  const { data, isLoading, error, refetch } = useBaseCommunities(params)
  const { data: editingCommunity } = useBaseCommunity(editingId || undefined)

  const [adjSearch, setAdjSearch] = useState('')
  const [adjDebouncedSearch, setAdjDebouncedSearch] = useState('')
  const adjListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setAdjDebouncedSearch(adjSearch), 300)
    return () => clearTimeout(t)
  }, [adjSearch])

  const {
    data: adjInfiniteData,
    fetchNextPage: fetchNextAdjPage,
    hasNextPage: hasNextAdjPage,
    isFetchingNextPage: isFetchingNextAdjPage,
    isLoading: isAdjLoading,
  } = useInfiniteBaseCommunitiesPicker(adjDebouncedSearch, isDialogOpen)

  const adjPickerRows = useMemo(() => {
    const rows = adjInfiniteData?.pages.flatMap((p) => p.results) ?? []
    if (!editingId) return rows
    return rows.filter((r) => r.id !== editingId)
  }, [adjInfiniteData, editingId])

  const adjTotalCount = adjInfiniteData?.pages[0]?.count ?? 0

  /** Matches API `adjacent`: one row per selected id with resolved name. */
  const dialogAdjacentList = useMemo(() => {
    return selectedAdjacentIds.map((id) => {
      const fromEditing = editingCommunity?.adjacent?.find((a) => a.id === id)
      const fromPicker = adjPickerRows.find((r) => r.id === id)
      return {
        id,
        name: fromEditing?.name ?? fromPicker?.name ?? id,
      }
    })
  }, [selectedAdjacentIds, editingCommunity?.adjacent, adjPickerRows])

  const handleAdjListScroll = useCallback(() => {
    const el = adjListRef.current
    if (!el) return
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 100) return
    if (hasNextAdjPage && !isFetchingNextAdjPage) void fetchNextAdjPage()
  }, [hasNextAdjPage, isFetchingNextAdjPage, fetchNextAdjPage])

  const createMutation = useCreateBaseCommunity()
  const updateMutation = useUpdateBaseCommunity()
  const deleteMutation = useDeleteBaseCommunity()

  const totalCount = data?.count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)))
  const hasNext = page < totalPages
  const hasPrev = page > 1

  // Client-side filter fallback in case the backend ignores 'search'
  const displayResults = useMemo(() => {
    const rows = data?.results ?? []
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((c) =>
      (c.name ?? '').toLowerCase().includes(q) ||
      c.adjacent?.some((a) => (a.name ?? '').toLowerCase().includes(q)),
    )
  }, [data?.results, debouncedSearch])

  const allVisibleIds = useMemo(() => displayResults.map((c) => c.id), [displayResults])
  const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id))

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      const merged = Array.from(new Set([...selectedIds, ...allVisibleIds]))
      setSelectedIds(merged)
    } else {
      const remaining = selectedIds.filter((id) => !allVisibleIds.includes(id))
      setSelectedIds(remaining)
    }
  }

  const toggleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    else setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  useEffect(() => {
    if (editingCommunity && dialogMode === 'edit') {
      setFormData({
        name: editingCommunity.name || '',
        boundary: editingCommunity.boundary ? JSON.stringify(editingCommunity.boundary, null, 2) : '',
        adjacent_ids: editingCommunity.adjacent_ids?.join(', ') || '',
      })
      const initialAdjIds = (editingCommunity.adjacent?.map(a => a.id) || editingCommunity.adjacent_ids || []) as string[]
      setSelectedAdjacentIds(initialAdjIds)
    }
  }, [editingCommunity, dialogMode])

  const handleAddCommunity = () => {
    setDialogMode('add')
    setEditingId(null)
    setFormData({ name: '', boundary: '', adjacent_ids: '' })
    setSelectedAdjacentIds([])
    setAdjSearch('')
    setAdjDebouncedSearch('')
    setIsDialogOpen(true)
  }

  const handleEditCommunity = (id: string) => {
    setDialogMode('edit')
    setEditingId(id)
    setAdjSearch('')
    setAdjDebouncedSearch('')
    setIsDialogOpen(true)
  }

  const handleDeleteCommunity = (community: BaseCommunity) => {
    setCommunityToDelete(community)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!communityToDelete) return
    try {
      await deleteMutation.mutateAsync(communityToDelete.id)
      toast({ title: 'Deleted', description: `"${communityToDelete.name}" has been deleted.` })
      setIsDeleteDialogOpen(false)
      setCommunityToDelete(null)
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete community.', variant: 'destructive' })
    }
  }

  const handleSubmit = async () => {
    try {
      let boundary = undefined
      if (formData.boundary.trim()) {
        try {
          boundary = JSON.parse(formData.boundary)
        } catch {
          toast({ title: 'Invalid boundary', description: 'Boundary must be valid GeoJSON.', variant: 'destructive' })
          return
        }
      }

      const typedFromText = formData.adjacent_ids
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const adjacent_ids = selectedAdjacentIds.length > 0 ? selectedAdjacentIds : typedFromText

      const payload: CreateBaseCommunityPayload = {
        name: formData.name,
        boundary,
        adjacent_ids: adjacent_ids.length > 0 ? adjacent_ids : undefined,
      }

      if (dialogMode === 'add') {
        await createMutation.mutateAsync(payload)
        toast({ title: 'Created', description: 'Base community created successfully.' })
      } else {
        await updateMutation.mutateAsync({ id: editingId!, payload })
        toast({ title: 'Updated', description: 'Base community updated successfully.' })
      }

      setIsDialogOpen(false)
      setFormData({ name: '', boundary: '', adjacent_ids: '' })
      setSelectedAdjacentIds([])
      setEditingId(null)
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Could not save community.', variant: 'destructive' })
    }
  }

  return (
    <DashboardLayout
      title='Adjacent Communities'
      description='Manage adjacent communities and their boundaries'
      breadcrumb={['Dashboard', 'Adjacent Communities']}
    >
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Adjacent Communities</CardTitle>
              </div>
              <Button size='sm' onClick={handleAddCommunity}>
                <Plus className='w-4 h-4 mr-2' />
                Add Adjacent Community
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='mb-4 flex items-center gap-2'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  placeholder='Search communities...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            {isLoading ? (
              <div className='text-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                <p>Loading communities...</p>
              </div>
            ) : error ? (
              <div className='text-center py-8'>
                <p className='text-red-500 mb-4'>Failed to load communities</p>
                <Button variant='outline' onClick={() => refetch()}>Try Again</Button>
              </div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button variant='ghost' size='sm' onClick={() => handleSort('name')} className='h-auto p-0 font-semibold' disabled={isLoading}>
                            Name
                            {sortBy === 'name' ? (
                              sortOrder === 1 ?
                                <ChevronUp className='ml-2 h-4 w-4' /> :
                                <ChevronDown className='ml-2 h-4 w-4' />
                            ) : (
                              <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Boundary</TableHead>
                        <TableHead>Adjacent</TableHead>
                        <TableHead>
                          <Button variant='ghost' size='sm' onClick={() => handleSort('created_at')} className='h-auto p-0 font-semibold' disabled={isLoading}>
                            Created
                            {sortBy === 'created_at' ? (
                              sortOrder === 1 ?
                                <ChevronUp className='ml-2 h-4 w-4' /> :
                                <ChevronDown className='ml-2 h-4 w-4' />
                            ) : (
                              <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant='ghost' size='sm' onClick={() => handleSort('updated_at')} className='h-auto p-0 font-semibold' disabled={isLoading}>
                            Updated
                            {sortBy === 'updated_at' ? (
                              sortOrder === 1 ?
                                <ChevronUp className='ml-2 h-4 w-4' /> :
                                <ChevronDown className='ml-2 h-4 w-4' />
                            ) : (
                              <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayResults.map((community) => (
                        <TableRow key={community.id}>
                          <TableCell>
                            <div className='font-medium'>{community.name}</div>
                          </TableCell>
                          <TableCell>
                            {community.boundary ? (
                              <Badge variant='secondary'>
                                {community.boundary.type}
                              </Badge>
                            ) : (
                              <span className='text-muted-foreground text-sm'>No boundary</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {community.adjacent && community.adjacent.length > 0 ? (
                              <div className='text-sm'>
                                <span className='mr-2'>{community.adjacent.slice(0, 2).map(a => a.name).join(', ')}</span>
                                {community.adjacent.length > 2 && (
                                  <Badge variant='secondary'>+{community.adjacent.length - 2} more</Badge>
                                )}
                              </div>
                            ) : community.adjacent_ids && community.adjacent_ids.length > 0 ? (
                              <span className='text-sm'>{community.adjacent_ids.length} adjacent</span>
                            ) : (
                              <span className='text-muted-foreground text-sm'>None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className='text-sm'>{community.created_at ? new Date(community.created_at).toLocaleString() : '-'}</span>
                          </TableCell>
                          <TableCell>
                            <span className='text-sm'>{community.updated_at ? new Date(community.updated_at).toLocaleString() : '-'}</span>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Button variant='ghost' size='sm' onClick={() => handleEditCommunity(community.id)}>
                                <Edit className='w-4 h-4' />
                              </Button>
                              <Button variant='ghost' size='sm' onClick={() => handleDeleteCommunity(community)}>
                                <Trash2 className='w-4 h-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {displayResults.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                            {debouncedSearch.trim() ? (
                              <>
                                <div className='text-lg font-medium mb-2'>No communities match &quot;{debouncedSearch.trim()}&quot;</div>
                                <p className='text-sm'>Try a different search term</p>
                              </>
                            ) : (
                              <>
                                <div className='text-lg font-medium mb-2'>No communities found</div>
                                <p className='text-sm'>Add a new base community to get started</p>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <PaginationControls
                  page={page}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  currentCount={displayResults.length}
                  onPageChange={setPage}
                  isLoading={isLoading}
                  hasNext={hasNext}
                  hasPrev={hasPrev}
                  label='communities'
                  pageSizeOptions={[10, 25, 50, 100]}
                  onPageSizeChange={(value) => {
                    setPageSize(value)
                    setPage(1)
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setAdjSearch('')
            setAdjDebouncedSearch('')
          }
        }}
      >
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Add Base Community' : 'Edit Base Community'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'add' ? 'Create a new base community' : 'Update base community details'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Name *</Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g., Barrie'
              />
            </div>
            {/* {dialogMode === 'add' && (
            <div className='space-y-2'>
              <Label htmlFor='boundary'>Boundary (GeoJSON)</Label>
              <Textarea
                id='boundary'
                value={formData.boundary}
                onChange={(e) => setFormData({ ...formData, boundary: e.target.value })}
                placeholder='{"type": "Polygon", "coordinates": [...]}'
                rows={8}
                className='font-mono text-sm'
              />
              <p className='text-xs text-muted-foreground'>Optional. Paste GeoJSON Polygon or MultiPolygon.</p>
            </div>
            )} */}
            <div className='space-y-2'>
              <Label htmlFor='adjacent_ids'>Adjacent Communities</Label>
              <Input
                id='adjacent-search'
                placeholder='Search communities to add...'
                value={adjSearch}
                onChange={(e) => setAdjSearch(e.target.value)}
              />
              <div
                ref={adjListRef}
                onScroll={handleAdjListScroll}
                onWheel={(e) => e.stopPropagation()}
                className='max-h-48 overflow-auto border rounded-md p-2'
              >
                {isAdjLoading ? (
                  <div className='text-sm text-muted-foreground'>Loading...</div>
                ) : (
                  adjPickerRows.map((opt) => {
                    const checked = selectedAdjacentIds.includes(opt.id)
                    return (
                      <label key={opt.id} className='flex items-center gap-2 py-1 cursor-pointer'>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val: any) => {
                            const isChecked = Boolean(val)
                            setSelectedAdjacentIds((prev) => {
                              if (isChecked) return prev.includes(opt.id) ? prev : [...prev, opt.id]
                              return prev.filter((x) => x !== opt.id)
                            })
                          }}
                        />
                        <span className='text-sm'>{opt.name}</span>
                      </label>
                    )
                  })
                )}
                {adjPickerRows.length === 0 && !isAdjLoading && (
                  <div className='text-sm text-muted-foreground'>No communities found</div>
                )}
                {isFetchingNextAdjPage ? (
                  <div className='flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground border-t'>
                    <Loader2 className='h-3.5 w-3.5 animate-spin shrink-0' />
                    Loading more…
                  </div>
                ) : null}
              </div>
              <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
                <span>
                  Showing {adjPickerRows.length}
                  {adjTotalCount > 0 ? ` of ${adjTotalCount}` : ''} · Selected: {selectedAdjacentIds.length}
                </span>
              </div>
              {dialogAdjacentList.length > 0 ? (
                <div className='rounded-md border bg-muted/40 p-3 space-y-2'>
                  <p className='text-sm font-semibold text-foreground'>Adjacent communities</p>
                  <ul className='max-h-56 overflow-y-auto space-y-2 pr-1'>
                    {dialogAdjacentList.map((a) => (
                      <li
                        key={a.id}
                        className='rounded-sm border border-border/80 bg-background px-2.5 py-2 text-sm'
                      >
                        <div className='font-medium text-foreground leading-snug'>{a.name}</div>
                        <div className='text-xs text-muted-foreground font-mono break-all mt-1'>{a.id}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {dialogMode === 'add' ? 'Create' : 'Update'}
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
              Are you sure you want to delete "{communityToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
