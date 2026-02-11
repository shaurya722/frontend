'use client'

import { useState, useEffect, useCallback } from 'react'
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
import {
  getComplianceAnalysis,
  type ComplianceResult,
  type ComplianceSummary,
  type CompliancePagination,
} from '@/lib/api'
import { Switch } from '@/components/ui/switch'

export default function ComplianceAnalysis() {
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [ordering, setOrdering] = useState('municipality_name')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState('all')
  const [offsetPercentage, setOffsetPercentage] = useState(0)
  const [applyAdjacentLogic, setApplyAdjacentLogic] = useState(false)
  const [applyEventOffsets, setApplyEventOffsets] = useState(false)
  const [applyDirectServiceOffsets, setApplyDirectServiceOffsets] =
    useState(false)

  const [results, setResults] = useState<ComplianceResult[]>([])
  const [summary, setSummary] = useState<ComplianceSummary | null>(null)
  const [pagination, setPagination] = useState<CompliancePagination | null>(
    null,
  )
  const [loading, setLoading] = useState(false)

  const programs = ['Paint', 'Lighting', 'Solvents', 'Pesticides']

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch data from backend
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getComplianceAnalysis({
        program: selectedProgram === 'all' ? undefined : selectedProgram,
        search: debouncedSearch || undefined,
        ordering,
        page,
        page_size: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        offset_percentage: offsetPercentage > 0 ? offsetPercentage : undefined,
      })

      if (response.data) {
        setResults(response.data.results)
        setSummary(response.data.summary)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error)
    } finally {
      setLoading(false)
    }
  }, [
    selectedProgram,
    debouncedSearch,
    ordering,
    page,
    pageSize,
    statusFilter,
    offsetPercentage,
  ])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'shortfall':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'excess':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              {/* Program Filter */}
              <div className='flex items-center gap-2'>
                <Label className='text-sm whitespace-nowrap'>Program</Label>
                <Select
                  value={selectedProgram}
                  onValueChange={(v) => {
                    setSelectedProgram(v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Select program' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All</SelectItem>
                    {programs.map((program) => (
                      <SelectItem key={program} value={program}>
                        {program}
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
                  checked={applyAdjacentLogic}
                  onCheckedChange={setApplyAdjacentLogic}
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
                  checked={applyEventOffsets}
                  onCheckedChange={setApplyEventOffsets}
                />
              </div>

              {/* Status Filter */}
              <div className='flex items-center gap-2'>
                <Label className='text-sm whitespace-nowrap'>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v)
                    setPage(1)
                  }}
                >
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

              {/* Offset Percentage */}
              {/* <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Offset %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="w-20"
                  value={offsetPercentage}
                  onChange={(e) => {
                    setOffsetPercentage(Number(e.target.value));
                    setPage(1);
                  }}
                />
              </div> */}
              <div className='flex items-center gap-2'>
                <Label
                  htmlFor='direct-service-offsets'
                  className='text-sm whitespace-nowrap'
                >
                  Direct Service Offsets
                </Label>
                <Switch
                  id='direct-service-offsets'
                  checked={applyDirectServiceOffsets}
                  onCheckedChange={setApplyDirectServiceOffsets}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
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
                {summary.compliant}
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
                {summary.shortfalls}
              </div>
              <p className='text-xs text-muted-foreground'>
                Need {summary.total_shortfall_sites} more sites
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
                {summary.excesses}
              </div>
              <p className='text-xs text-muted-foreground'>
                {summary.total_excess_sites} sites available
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
                {summary.overall_compliance_rate}%
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
              <div className='text-2xl font-bold'>{summary.total_actual}</div>
              <p className='text-xs text-muted-foreground'>
                Adjusted site count
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results Table */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
              <CardTitle>Detailed Compliance Results</CardTitle>
              <CardDescription>
                Census subdivision-level compliance analysis
                {pagination && ` (${pagination.total_count} results)`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto -mx-4 sm:mx-0'>
            <div className='inline-block min-w-full align-middle px-4 sm:px-0'>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('municipality_name')}
                      >
                        <div className='flex items-center gap-1'>
                          Census Subdivision
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('municipality_name')}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('program')}
                      >
                        <div className='flex items-center gap-1'>
                          Program
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('program')}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('required')}
                      >
                        <div className='flex items-center gap-1'>
                          Required
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('required')}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead className='bg-gray-50'>Actual</TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('adjusted')}
                      >
                        <div className='flex items-center gap-1'>
                          Adjusted
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('adjusted')}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead className='bg-gray-50'>
                        Municipal/FN Sites
                      </TableHead>
                      <TableHead className='bg-gray-50'>Other Sites</TableHead>
                      <TableHead className='bg-gray-50'>Events</TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('shortfall')}
                      >
                        <div className='flex items-center gap-1'>
                          Shortfall
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('shortfall')}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('excess')}
                      >
                        <div className='flex items-center gap-1'>
                          Excess
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('excess')}
                          </span>
                        </div>
                      </TableHead>
                      <TableHead className='bg-gray-50'>Rate</TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/50 bg-gray-50'
                        onClick={() => handleSort('status')}
                      >
                        <div className='flex items-center gap-1'>
                          Status
                          <ArrowUpDown className='h-3 w-3' />
                          <span className='text-xs'>
                            {getSortIcon('status')}
                          </span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow
                        key={`${result.municipality_id}-${result.program}-${index}`}
                      >
                        <TableCell className='font-medium'>
                          {result.municipality_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>{result.program}</Badge>
                        </TableCell>
                        <TableCell>{result.required}</TableCell>
                        <TableCell>{result.actual}</TableCell>
                        <TableCell>
                          <span className='font-medium'>{result.adjusted}</span>
                          {/*  {(result.incoming > 0 || result.outgoing > 0) && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({result.incoming > 0 && <span className="text-green-600">+{result.incoming}</span>}
                              {result.incoming > 0 && result.outgoing > 0 && "/"}
                              {result.outgoing > 0 && <span className="text-red-600">-{result.outgoing}</span>})
                            </span>
                          )} */}
                        </TableCell>
                        <TableCell>{result.municipal_depots}</TableCell>
                        <TableCell>{result.return_to_retail}</TableCell>
                        <TableCell>{result.events}</TableCell>
                        <TableCell>
                          {result.shortfall > 0 && (
                            <span className='text-red-600 font-medium'>
                              {result.shortfall}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.excess > 0 && (
                            <span className='text-blue-600 font-medium'>
                              {result.excess}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Progress
                              value={Math.min(result.compliance_rate, 100)}
                              className='w-12 sm:w-16'
                            />
                            <span className='text-xs sm:text-sm'>
                              {Math.round(result.compliance_rate)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={getStatusColor(result.status)}
                          >
                            {result.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {results.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={12}
                          className='text-center py-8 text-muted-foreground'
                        >
                          No results found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className='flex items-center justify-between mt-4 pt-4 border-t gap-4'>
              <div className='text-sm text-muted-foreground'>
                Page {pagination.page} of {pagination.total_pages} (
                {pagination.total_count} total)
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
                  disabled={!pagination.has_previous}
                >
                  <ChevronLeft className='h-4 w-4' />
                  <ChevronLeft className='h-4 w-4 -ml-2' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.has_previous}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>

                {/* Page Numbers */}
                {(() => {
                  const pages: number[] = []
                  const totalPages = pagination.total_pages
                  const currentPage = pagination.page

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
                  disabled={!pagination.has_next}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(pagination.total_pages)}
                  disabled={!pagination.has_next}
                >
                  <ChevronRight className='h-4 w-4' />
                  <ChevronRight className='h-4 w-4 -ml-2' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
