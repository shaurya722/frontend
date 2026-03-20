'use client'

import { useState } from 'react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Calendar, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PaginationControls } from '@/components/pagination-controls'
import {
  useCensusYearsList,
  useCreateCensusYear,
  useUpdateCensusYear,
  useDeleteCensusYear,
} from '@/features/census-year/useCensusYearsManagement'
import type { CensusYear, CensusYearsResponse } from '@/features/census-year/census-years'

export default function CensusYearManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<CensusYear | null>(null)
  const [yearInput, setYearInput] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading, error } = useCensusYearsList({ page, limit })
  const createMutation = useCreateCensusYear()
  const updateMutation = useUpdateCensusYear()
  const deleteMutation = useDeleteCensusYear()

  const handleCreate = () => {
    const year = parseInt(yearInput)
    if (isNaN(year) || year < 1900 || year > 2100) {
      return
    }

    createMutation.mutate(
      { year },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false)
          setYearInput('')
        },
      }
    )
  }

  const handleUpdate = () => {
    if (!selectedYear) return

    const year = parseInt(yearInput)
    if (isNaN(year) || year < 1900 || year > 2100) {
      return
    }

    updateMutation.mutate(
      { id: selectedYear.id, data: { year } },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false)
          setSelectedYear(null)
          setYearInput('')
        },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedYear) return

    deleteMutation.mutate(selectedYear.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setSelectedYear(null)
      },
    })
  }

  const openEditDialog = (year: CensusYear) => {
    setSelectedYear(year)
    setYearInput(year.year.toString())
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (year: CensusYear) => {
    setSelectedYear(year)
    setIsDeleteDialogOpen(true)
  }

  const yearsData = data as CensusYearsResponse | undefined
  const sortedYears = yearsData?.results?.slice().sort((a, b) => b.year - a.year) || []

  return (
    <div className='space-y-6'>
    

      {/* Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3'>
              <Calendar className='w-8 h-8 text-blue-600' />
              <div>
                <p className='text-2xl font-bold'>{yearsData?.count || 0}</p>
                <p className='text-xs text-muted-foreground'>Total Years</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3'>
              <Calendar className='w-8 h-8 text-green-600' />
              <div>
                <p className='text-2xl font-bold'>
                  {sortedYears[0]?.year || 'N/A'}
                </p>
                <p className='text-xs text-muted-foreground'>Latest Year</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-3'>
              <Calendar className='w-8 h-8 text-orange-600' />
              <div>
                <p className='text-2xl font-bold'>
                  {sortedYears[sortedYears.length - 1]?.year || 'N/A'}
                </p>
                <p className='text-xs text-muted-foreground'>Earliest Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Census Years Table */}
      <Card>
        <CardHeader>
          <CardTitle>Census Years</CardTitle>
          <CardDescription>
            View and manage all census years in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='w-full flex justify-end mb-2'>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className='w-4 h-4 mr-2' />
              Add Census Year
            </Button>
          </div>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
            </div>
          ) : error ? (
            <div className='text-center py-8 text-red-600'>
              Failed to load census years. Please try again.
            </div>
          ) : sortedYears.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No census years found. Add your first census year to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedYears.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className='font-medium'>{year.id}</TableCell>
                    <TableCell className='text-lg font-semibold'>
                      {year.year}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openEditDialog(year)}
                        >
                          <Pencil className='w-4 h-4 mr-1' />
                          Edit
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openDeleteDialog(year)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='w-4 h-4 mr-1' />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {/* Pagination Controls */}
          <PaginationControls
            page={page}
            pageSize={limit}
            totalCount={yearsData?.count || 0}
            currentCount={yearsData?.results?.length || 0}
            onPageChange={(p) => setPage(p)}
            isLoading={isLoading}
            hasNext={Boolean(yearsData?.next)}
            hasPrev={Boolean(yearsData?.previous)}
            label='years'
            pageSizeOptions={[5, 10, 20, 50]}
            onPageSizeChange={(size) => {
              setLimit(size)
              setPage(1)
            }}
            className='mt-4'
          />
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Census Year</DialogTitle>
            <DialogDescription>
              Create a new census year for tracking community data
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='create-year'>Year</Label>
              <Input
                id='create-year'
                type='number'
                placeholder='Enter year (e.g., 2024)'
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                min='1900'
                max='2100'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsCreateDialogOpen(false)
                setYearInput('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !yearInput}
            >
              {createMutation.isPending && (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Census Year</DialogTitle>
            <DialogDescription>
              Update the census year information
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-year'>Year</Label>
              <Input
                id='edit-year'
                type='number'
                placeholder='Enter year (e.g., 2024)'
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                min='1900'
                max='2100'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedYear(null)
                setYearInput('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !yearInput}
            >
              {updateMutation.isPending && (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              )}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the census year{' '}
              <span className='font-semibold'>{selectedYear?.year}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedYear(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className='bg-red-600 hover:bg-red-700'
            >
              {deleteMutation.isPending && (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
