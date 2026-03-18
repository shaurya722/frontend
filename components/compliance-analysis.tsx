'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Settings,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

import { Switch } from '@/components/ui/switch'
import { useCompliance, useRecalculateCompliance } from '@/features/compliance/hooks'
import { ComplianceFilters } from '@/features/compliance/types'
import { useCensusYears } from '@/features/communities'
import { PaginationControls } from '@/components/pagination-controls'
import { useToast } from '@/hooks/use-toast'

export default function ComplianceAnalysis() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [program, setProgram] = useState('')
  const [status, setStatus] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [ordering, setOrdering] = useState('community__name')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filters: ComplianceFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      program: program || undefined,
      status: (status as 'compliant' | 'shortfall' | 'excess') || undefined,
      year: selectedYear !== 'all' ? selectedYear : undefined,
      page,
      limit,
      ordering,
    }),
    [debouncedSearch, program, status, selectedYear, page, limit, ordering]
  )

  const { data, isLoading, error } = useCompliance(filters)
  const { mutateAsync: recalculateCompliance, isPending: isRecalculating } = useRecalculateCompliance()
  const { toast } = useToast()

  // Fetch census years
  const { data: censusYearsData, isLoading: isCensusYearsLoading } = useCensusYears()

  // Set latest census year as default when data loads
  useEffect(() => {
    if (censusYearsData?.years && censusYearsData.years.length > 0) {
      const latestYear = Math.max(...censusYearsData.years.map((y: { year: number }) => y.year))
      setSelectedYear(latestYear.toString())
    }
  }, [censusYearsData])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleProgramChange = (value: string) => {
    setProgram(value === 'all' ? '' : value)
    setPage(1)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value === 'all' ? '' : value)
    setPage(1)
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleRecalculate = async () => {
    if (selectedYear === 'all') {
      toast({
        title: 'Select year',
        description: 'Choose a specific census year to recalculate compliance.',
        variant: 'destructive',
      })
      return
    }

    const selectedYearNumber = Number(selectedYear)
    if (Number.isNaN(selectedYearNumber)) {
      toast({
        title: 'Invalid year',
        description: 'Unable to determine the selected census year.',
        variant: 'destructive',
      })
      return
    }

    const censusYearEntry = censusYearsData?.years?.find((year) => year.year === selectedYearNumber)

    if (!censusYearEntry?.id) {
      toast({
        title: 'Year not found',
        description: 'Could not locate the census year identifier.',
        variant: 'destructive',
      })
      return
    }

    try {
      await recalculateCompliance(censusYearEntry.id)
      toast({
        title: 'Calculation complete',
        description: `Compliance recalculated for ${censusYearEntry.year}.`,
      })
    } catch (mutationError: any) {
      toast({
        title: 'Calculation failed',
        description: mutationError?.message || 'Unable to recalculate compliance. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center py-8 text-red-600'>
              Error loading compliance data. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const summary = data?.summary
  const results = data?.results || []
  const hasNext = !!data?.next
  const hasPrev = !!data?.previous
  const totalPages = data ? Math.ceil(data.count / limit) : 1

  return (
    <div className='space-y-6'>
      {/* Controls */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4'>
            {/* Search and Filters Row */}
            <div className='flex flex-col xl:flex-row gap-4 flex-wrap'>
              {/* Search */}
              <div className='flex-1 min-w-80'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search by Census Subdivision...'
                    className='pl-10'
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
              {/* Program Filter */}
              <div className='flex items-center gap-2'>
                <Label className='text-sm whitespace-nowrap'>Program</Label>
                <Select value={program || 'all'} onValueChange={handleProgramChange}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Select program' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Paint'>Paint</SelectItem>
                    <SelectItem value='Lighting'>Lighting</SelectItem>
                    <SelectItem value='Solvents'>Solvents</SelectItem>
                    <SelectItem value='Pesticides'>Pesticides</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Year Filter */}
              <div className='flex items-center gap-2'>
                <Label className='text-sm whitespace-nowrap'>Year</Label>
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Select year' />
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
              <div className='flex items-center gap-2'>
                <Settings className='w-4 h-4 shrink-0' />
                <Label
                  htmlFor='adjacent-logic'
                  className='text-sm whitespace-nowrap'
                >
                  Adjacent Logic
                </Label>
                <Switch
                  id='adjacent-logic'
                />
              </div>
              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='event-offsets'
                  className='text-sm whitespace-nowrap'
                >
                  Event Offsets
                </Label>
                <Switch
                  id='event-offsets'
                />
              </div>
              {/* Status Filter */}
              <div className='flex items-center gap-2'>
                <Label className='text-sm whitespace-nowrap'>Status</Label>
                <Select value={status || 'all'} onValueChange={handleStatusChange}>
                  <SelectTrigger className='w-36'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='compliant'>Compliant</SelectItem>
                    <SelectItem value='shortfall'>Shortfall</SelectItem>
                    <SelectItem value='excess'>Excess</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='direct-service-offsets'
                  className='text-sm whitespace-nowrap'
                >
                  Direct Service Offsets
                </Label>
                <Switch
                  id='direct-service-offsets'
                />
              </div>
              <div className='flex items-center gap-2'>
                <Button onClick={handleRecalculate} disabled={isRecalculating}>
                  {isRecalculating ? 'Calculating…' : 'Calculate'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Compliant Communities
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {isLoading ? '...' : summary?.compliant_communities || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Census subdivision-program combinations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Shortfalls</CardTitle>
            <TrendingDown className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {isLoading ? '...' : summary?.shortfalls || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Need {isLoading ? '...' : summary?.shortfalls || 0} more sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Excesses</CardTitle>
            <TrendingUp className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {isLoading ? '...' : summary?.excesses || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {isLoading ? '...' : summary?.excesses || 0} sites available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Overall Rate
            </CardTitle>
            <AlertTriangle className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? '...' : `${summary?.overall_rate || 0}%`}
            </div>
            <p className='text-xs text-muted-foreground'>Compliance rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sites</CardTitle>
            <div className='h-4 w-4 bg-gray-400 rounded-full' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{isLoading ? '...' : summary?.total_sites || 0}</div>
            <p className='text-xs text-muted-foreground'>
              Adjusted site count
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <CardTitle>Detailed Compliance Results</CardTitle>
              <CardDescription>
                Census subdivision-level compliance analysis ({isLoading ? '...' : data?.count || 0} results)
              </CardDescription>
            </div>
            
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto -mx-4 sm:mx-0'>
            <div className='inline-block min-w-full align-middle px-4 sm:px-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='bg-gray-50'>
                      Census Subdivision
                    </TableHead>
                    <TableHead className='bg-gray-50'>
                      Program
                    </TableHead>
                    <TableHead className='bg-gray-50'>
                      Required
                    </TableHead>
                    <TableHead className='bg-gray-50'>Actual</TableHead>
                    <TableHead className='bg-gray-50'>
                      Shortfall
                    </TableHead>
                    <TableHead className='bg-gray-50'>
                      Excess
                    </TableHead>
                    <TableHead className='bg-gray-50'>Rate</TableHead>
                    <TableHead className='bg-gray-50'>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className='text-center py-8 text-muted-foreground'
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : results.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className='text-center py-8 text-muted-foreground'
                      >
                        No results found
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.community_name}</TableCell>
                        <TableCell>{item.program}</TableCell>
                        <TableCell>{item.required_sites}</TableCell>
                        <TableCell>{item.actual_sites}</TableCell>
                        <TableCell>{item.shortfall}</TableCell>
                        <TableCell>{item.excess}</TableCell>
                        <TableCell>{item.compliance_rate}%</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === 'compliant'
                                ? 'default'
                                : item.status === 'shortfall'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <hr />
              <PaginationControls
                page={page}
                pageSize={limit}
                totalCount={data?.count || 0}
                currentCount={results.length}
                onPageChange={handlePageChange}
                isLoading={isLoading}
                hasNext={hasNext}
                hasPrev={hasPrev}
                label="results"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}