'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Edit, CheckCircle, Plus, Info, Trash2, Search, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import type { RegulatoryRule } from '@/features/regulatory-rules'
import { useRegulatoryRules, useRegulatoryRule, useUpdateRegulatoryRule, useDeleteRegulatoryRule, useCreateRegulatoryRule } from '@/features/regulatory-rules'
import { useCensusYears } from '@/features/communities'
import { PaginationControls } from '@/components/pagination-controls'

interface RuleParameters {
  // Site Calculation Parameters
  applicableGeographicTypes?: string[]
  minPopulation?: number
  maxPopulation?: number | null
  sitesPerPopulation?: number
  baseRequirement?: number
  additionalPerPopulation?: number
  roundUpPortion?: boolean
  formula?: string

  // Offset Parameters
  maxOffsetPercentage?: number
  applicablePrograms?: string[]
  excludedOperatorTypes?: string[]
  requiresAdjacency?: boolean
  description?: string

  // Minimum Requirement Parameters
  minimumSites?: number
}

interface RegulatoryRulesManagementProps {
  currentUser?: {
    id: string
    name: string
    role: string
  } | null
}

const toDateInputValue = (date?: string | Date | null) => {
  if (!date) return ''
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().split('T')[0]
}

const mapRuleToFormValues = (rule: RegulatoryRule) => ({
  regulatory_rule: rule.regulatory_rule ?? '',
  name: rule.name ?? '',
  census_year: rule.year,
  description: rule.description ?? '',
  program: rule.program ?? 'Paint',
  category: rule.category ?? 'HSP',
  rule_type: rule.rule_type ?? 'Site Requirements',
  min_population: rule.min_population ?? 0,
  max_population: rule.max_population ?? null,
  site_per_population: rule.site_per_population ?? null,
  base_required_sites: rule.base_required_sites ?? null,
  event_offset_percentage: rule.event_offset_percentage ?? null,
  reallocation_percentage: rule.reallocation_percentage ?? null,
  is_active: rule.is_active ?? true,
  start_date: toDateInputValue(rule.start_date),
  end_date: toDateInputValue(rule.end_date),
})

export default function RegulatoryRulesManagement({
  currentUser,
}: RegulatoryRulesManagementProps) {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRuleType, setSelectedRuleType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCensusYear, setSelectedCensusYear] = useState<string>('all')
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Sort state
  const [sortOrder, setSortOrder] = useState<1 | -1>(-1)
  const [sortBy, setSortBy] = useState('created_at')
  
  // Handle sort column clicks
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 1 ? -1 : 1)
    } else {
      setSortBy(field)
      setSortOrder(-1)
    }
  }
  
  // Dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null)
  const [deleteRuleName, setDeleteRuleName] = useState<string>('')

  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Show success/error messages temporarily
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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
      sort: sortOrder === -1 ? `-${sortBy}` : sortBy,
      program: selectedProgram !== 'all' ? selectedProgram : undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      rule_type: selectedRuleType !== 'all' ? selectedRuleType : undefined,
      is_active: selectedStatus !== 'all' ? selectedStatus : undefined,
      year: selectedCensusYear !== 'all' ? parseInt(selectedCensusYear) : undefined,
    }
  }, [page, pageSize, debouncedSearch, selectedProgram, selectedCategory, selectedRuleType, selectedStatus, selectedCensusYear, sortOrder, sortBy])

  // Fetch regulatory rules using React Query
  const { data: regulatoryRulesResponse, isLoading, error, refetch } = useRegulatoryRules(queryParams)
  // Fetch census years
  const { data: censusYearsData, isLoading: isCensusYearsLoading } = useCensusYears()
  // Mutations
  const updateMutation = useUpdateRegulatoryRule()
  const deleteMutation = useDeleteRegulatoryRule()
  const createMutation = useCreateRegulatoryRule()

  // Create form validation schema
  const createSchema = yup.object({
    regulatory_rule: yup.string().required('Rule name is required'),
    census_year: yup.number().required('Census year is required'),
    description: yup.string().required('Description is required'),
    program: yup.string().required('Program is required'),
    category: yup.string().required('Category is required'),
    rule_type: yup.string().required('Rule type is required'),
    min_population: yup.number().nullable(),
    max_population: yup.number().nullable(),
    site_per_population: yup.number().nullable(),
    base_required_sites: yup.number().nullable(),
    event_offset_percentage: yup.number().nullable(),
    reallocation_percentage: yup.number().nullable(),
    is_active: yup.boolean(),
    start_date: yup.date().required('Start date is required'),
    end_date: yup.date().nullable(),
  }).required()

  const editSchema = yup.object({
    regulatory_rule: yup.string().required('Rule identifier is required'),
    name: yup.string().required('Name is required'),
    census_year: yup.number().required('Census year is required'),
    description: yup.string().required('Description is required'),
    program: yup.string().required('Program is required'),
    category: yup.string().required('Category is required'),
    rule_type: yup.string().required('Rule type is required'),
    min_population: yup.number().nullable(),
    max_population: yup.number().nullable(),
    site_per_population: yup.number().nullable(),
    base_required_sites: yup.number().nullable(),
    event_offset_percentage: yup.number().nullable(),
    reallocation_percentage: yup.number().nullable(),
    is_active: yup.boolean(),
    start_date: yup.date().required('Start date is required'),
    end_date: yup.date().nullable(),
  }).required()

  const createForm = useForm({
    resolver: yupResolver(createSchema),
    defaultValues: {
      regulatory_rule: '',
      census_year: 2024,
      description: '',
      program: 'Paint',
      category: 'HSP',
      rule_type: 'Site Requirements',
      min_population: 0,
      max_population: null,
      site_per_population: null,
      base_required_sites: null,
      event_offset_percentage: null,
      reallocation_percentage: null,
      is_active: true,
      start_date: toDateInputValue(new Date()),
      end_date: '',
    },
  })

  const editForm = useForm({
    resolver: yupResolver(editSchema),
    defaultValues: {
      regulatory_rule: '',
      name: '',
      census_year: 2024,
      description: '',
      program: 'Paint',
      category: 'HSP',
      rule_type: 'Site Requirements',
      min_population: 0,
      max_population: null,
      site_per_population: null,
      base_required_sites: null,
      event_offset_percentage: null,
      reallocation_percentage: null,
      is_active: true,
      start_date: toDateInputValue(new Date()),
      end_date: '',
    },
  })

  //   for edit functionality
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)

  // Fetch single rule for editing
  const { data: editingRuleData, isLoading: isEditingRuleLoading } = useRegulatoryRule(
    editingRuleId || '',
    !!editingRuleId && isEditDialogOpen
  )

  // Set latest census year as default when data loads
  useEffect(() => {
    if (censusYearsData?.years && censusYearsData.years.length > 0) {
      const latestYear = Math.max(...censusYearsData.years.map(y => y.year))
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

  // Populate edit form when rule data is loaded
  useEffect(() => {
    if (editingRuleData && isEditDialogOpen) {
      editForm.reset(mapRuleToFormValues(editingRuleData))
    }
  }, [editingRuleData, isEditDialogOpen, editForm])

  const handleEditRule = (rule: RegulatoryRule) => {
    setEditingRuleId(rule.id.toString())
    editForm.reset(mapRuleToFormValues(rule))
    setIsEditDialogOpen(true)
  }

  const handleSaveRule = async (data: any) => {
    if (!editingRuleId) return

    try {
      // Format data to match API structure
      const updateData = {
        regulatory_rule: data.regulatory_rule,
        name: data.name,
        census_year: data.census_year,
        description: data.description,
        program: data.program,
        category: data.category,
        rule_type: data.rule_type,
        min_population: data.min_population,
        max_population: data.max_population,
        site_per_population: data.site_per_population,
        base_required_sites: data.base_required_sites,
        reallocation_percentage: data.reallocation_percentage,
        event_offset_percentage: data.event_offset_percentage,
        is_active: data.is_active,
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : null,
      }

      await updateMutation.mutateAsync({
        id: editingRuleId.toString(),
        data: updateData,
      })

      setEditingRuleId(null)
      setIsEditDialogOpen(false)
      editForm.reset()
      setSuccessMessage(`Regulatory rule "${data.name || data.regulatory_rule}" updated successfully`)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update regulatory rule')
    }
  }

  const handleCreateRule = async (data: any) => {
    try {
      const createData = {
        regulatory_rule: data.regulatory_rule,
        name: data.regulatory_rule,
        census_year: data.census_year,
        program: data.program,
        category: data.category,
        rule_type: data.rule_type,
        description: data.description,
        min_population: data.min_population,
        max_population: data.max_population,
        site_per_population: data.site_per_population,
        base_required_sites: data.base_required_sites,
        event_offset_percentage: data.event_offset_percentage,
        reallocation_percentage: data.reallocation_percentage,
        is_active: data.is_active,
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : null,
      }

      await createMutation.mutateAsync(createData)

      setIsCreateDialogOpen(false)
      createForm.reset()
      refetch()
      setSuccessMessage(`Regulatory rule "${data.regulatory_rule}" created successfully`)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create regulatory rule')
    }
  }

  const handleDeleteRule = (ruleId: string, ruleName: string) => {
    setDeleteRuleId(ruleId)
    setDeleteRuleName(ruleName)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteRuleId) return

    try {
      await deleteMutation.mutateAsync(deleteRuleId)
      setSuccessMessage(`Regulatory rule "${deleteRuleName}" deleted successfully`)
      setIsDeleteDialogOpen(false)
      setDeleteRuleId(null)
      setDeleteRuleName('')
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to delete regulatory rule')
    }
  }

  const handleEditCommunity = editForm.handleSubmit(handleSaveRule)


  const renderRuleParameters = (rule: RegulatoryRule) => {
    if (rule.rule_type === 'Site Requirements') {
      return (
        <div className='space-y-1 text-sm'>
          {rule.min_population !== null && rule.min_population !== undefined && (
            <div>
              <span className='font-medium'>Min Population:</span>{' '}
              {rule.min_population.toLocaleString()}
            </div>
          )}
          {rule.max_population !== null && rule.max_population !== undefined && (
            <div>
              <span className='font-medium'>Max Population:</span>{' '}
              {rule.max_population.toLocaleString()}
            </div>
          )}
          {rule.site_per_population && (
            <div>
              <span className='font-medium'>Sites Per Population:</span>{' '}
              1 per {rule.site_per_population.toLocaleString()} people
            </div>
          )}
          {rule.base_required_sites && (
            <div>
              <span className='font-medium'>Base Sites:</span>{' '}
              {rule.base_required_sites}
            </div>
          )}
        </div>
      )
    }

    if (rule.rule_type === 'Events') {
      return (
        <div className='space-y-1 text-sm'>
          {rule.event_offset_percentage !== null && rule.event_offset_percentage !== undefined && (
            <div>
              <span className='font-medium'>Event Offset:</span>{' '}
              {rule.event_offset_percentage}%
            </div>
          )}
          <div className='text-xs text-muted-foreground'>
            Events can offset up to {rule.event_offset_percentage}% of required sites
          </div>
        </div>
      )
    }

    if (rule.rule_type === 'Reallocation') {
      return (
        <div className='space-y-1 text-sm'>
          {rule.reallocation_percentage !== null && rule.reallocation_percentage !== undefined && (
            <div>
              <span className='font-medium'>Reallocation:</span>{' '}
              {rule.reallocation_percentage}%
            </div>
          )}
          <div className='text-xs text-muted-foreground'>
            Up to {rule.reallocation_percentage}% of sites can come from reallocation
          </div>
        </div>
      )
    }

    return (
      <div className='text-sm text-muted-foreground'>No parameters defined</div>
    )
  }

  const getRuleTypeBadgeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'Site Requirements':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'Events':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'Reallocation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'site_calculation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'minimum_requirement':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'offset_event':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'offset_adjacent':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  // Since API returns object with results array, extract the rules array
  const rawRules = regulatoryRulesResponse?.results || []
  const totalRules = typeof regulatoryRulesResponse?.count === 'number'
    ? regulatoryRulesResponse!.count
    : rawRules.length
  const hasNextPage = typeof regulatoryRulesResponse?.next === 'string'
    ? Boolean(regulatoryRulesResponse?.next)
    : false
  const hasPrevPage = typeof regulatoryRulesResponse?.previous === 'string'
    ? Boolean(regulatoryRulesResponse?.previous)
    : false

  // Apply client-side sorting
  const rules = useMemo(() => {
    if (!Array.isArray(rawRules)) return []

    return [...rawRules].sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a]
      let bValue: any = b[sortBy as keyof typeof b]

      // Handle string comparison (case insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 1 ? -1 : 1
      if (aValue > bValue) return sortOrder === 1 ? 1 : -1
      return 0
    })
  }, [rawRules, sortBy, sortOrder])

  const ruleStats = {
    total: Array.isArray(rules) ? rules.length : 0,
    active: Array.isArray(rules) ? rules.filter((r) => r.is_active).length : 0,
    siteCalculation: Array.isArray(rules) ? rules.filter((r) => r.rule_type === 'Site Requirements').length : 0,
    offsetRules: Array.isArray(rules) ? rules.filter((r) => r.rule_type === 'Events' || r.rule_type === 'Reallocation').length : 0,
    programs: Array.isArray(rules) ? new Set(rules.map((r) => r.program)).size : 0,
  }

  return (
    <div className='space-y-6'>
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

      {/* Header with Stats */}
      {/* <div className='grid gap-4 md:grid-cols-3 xl:grid-cols-5'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{ruleStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {ruleStats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Site Calculations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {ruleStats.siteCalculation}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Offset Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>
              {ruleStats.offsetRules}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{ruleStats.programs}</div>
          </CardContent>
        </Card>
      </div> */}

      {/* Main Rules Table */}
      <Card>
        
        <CardContent>
          {/* Search and Filters */}
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-6 pt-3'>
            <div className='relative'>
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Programs</SelectItem>
                <SelectItem value='Paint'>Paint</SelectItem>
                <SelectItem value='Solvents'>Solvents</SelectItem>
                <SelectItem value='Pesticides'>Pesticides</SelectItem>
                <SelectItem value='Lighting'>Lighting</SelectItem>
                <SelectItem value='All'>All (Offsets)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                <SelectItem value='HSP'>
                  HSP (Hazardous & Special Products)
                </SelectItem>
                <SelectItem value='EEE'>
                  EEE (Electrical & Electronic Equipment)
                </SelectItem>
                <SelectItem value='Offset'>Offset Rules</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Rule Types</SelectItem>
                <SelectItem value='Site Requirements'>
                  Site Requirements
                </SelectItem>
                <SelectItem value='Events'>Events</SelectItem>
                <SelectItem value='Reallocation'>Reallocation</SelectItem>
              </SelectContent>
            </Select>
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
                {censusYearsData?.years?.map((year) => (
                  <SelectItem key={year.id} value={year.year.toString()}>
                    {year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-black hover:bg-black/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>

          {/* Rules Table */}
          <div className='border rounded-lg relative'>
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading regulatory rules...
                </div>
              </div>
            )}
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
                    <Button variant="ghost" size="sm" onClick={() => handleSort('program')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                      Program
                      {sortBy === 'program' ? (
                        sortOrder === 1 ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('category')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                      Category
                      {sortBy === 'category' ? (
                        sortOrder === 1 ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" onClick={() => handleSort('rule_type')} className="h-auto p-0 font-semibold" disabled={isLoading}>
                      Type
                      {sortBy === 'rule_type' ? (
                        sortOrder === 1 ? 
                          <ChevronUp className="ml-2 h-4 w-4" /> : 
                          <ChevronDown className="ml-2 h-4 w-4" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                      Census Year
                  </TableHead>
                  <TableHead>Parameters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(rules) && rules.length > 0 ? rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium whitespace-nowrap'>
                          {rule.name}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {rule.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline'>{rule.program}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{rule.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getRuleTypeBadgeColor(rule.rule_type)}
                      >
                        {rule.rule_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                   {rule.year}
                    </TableCell>
                    <TableCell className='max-w-md whitespace-nowrap'>
                      {renderRuleParameters(rule)}
                    </TableCell>
                    <TableCell>
                      {rule.is_active === true ? (
                        <Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'>
                          <CheckCircle className='h-3 w-3 mr-1' />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant='secondary'>Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEditRule(rule)}
                          disabled={isLoading}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteRule(rule.id.toString(), rule.name)}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          disabled={isLoading}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : !isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No rules found matching the current filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalCount={totalRules}
            currentCount={rules.length}
            onPageChange={(newPage) => setPage(newPage)}
            isLoading={isLoading}
            hasNext={hasNextPage}
            hasPrev={hasPrevPage}
            label="regulatory rules"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Info className='h-5 w-5' />
            Ontario Regulatory Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='space-y-3'>
              <h4 className='font-semibold'>HSP Regulation</h4>
              <ul className='text-sm text-muted-foreground space-y-2'>
                <li>
                  • Paint & Coatings: 1 site per 40K people (≤500K), 13 base + 1
                  per 150K &gt;500K)
                </li>
                <li>
                  • Pesticides & Solvents: 1 site per 250K people (10K-500K), 2
                  base + 1 per 300K &gt;500K)
                </li>
                <li>
                  • Territorial Districts: Minimum 1 site for 1000+ population
                </li>
              </ul>
            </div>
            <div className='space-y-3'>
              <h4 className='font-semibold'>EEE Regulation</h4>
              <ul className='text-sm text-muted-foreground space-y-2'>
                <li>
                  • Lighting Equipment: 1 site per 15K people (≤500K), 34 base +
                  1 per 50K &gt;500K)
                </li>
                <li>
                  • Territorial Districts: Minimum 1 site for 1000+ population
                </li>
              </ul>
            </div>
            <div className='space-y-3'>
              <h4 className='font-semibold'>Offset Rules</h4>
              <ul className='text-sm text-muted-foreground space-y-2'>
                <li>
                  • Events: Up to 35% of required sites can be temporary events
                </li>
                <li>
                  • Adjacent Communities: Up to 10% sharing (excludes
                  Municipal/Regional/First Nations operators)
                </li>
              </ul>
            </div>
            <div className='space-y-3'>
              <h4 className='font-semibold'>Geographic Classifications</h4>
              <ul className='text-sm text-muted-foreground space-y-2'>
                <li>
                  • Local Municipality: Cities, towns, townships with standard
                  population rules
                </li>
                <li>
                  • Territorial District: Districts with minimum site
                  requirements
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setEditingRuleId(null)
          editForm.reset()
        }
      }}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Regulatory Rule</DialogTitle>
            <DialogDescription>
              Modify rule parameters and settings
            </DialogDescription>
          </DialogHeader>

          {isEditingRuleLoading ? (
            <div className='text-center py-8 text-muted-foreground'>
              Loading rule data...
            </div>
          ) : (
            <form onSubmit={handleEditCommunity} className="space-y-4">
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-name'>Rule Name *</Label>
                  <Input
                    id='edit-name'
                    {...editForm.register('name')}
                    className={editForm.formState.errors.name ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-program'>Program</Label>
                  <Controller
                    name="program"
                    control={editForm.control}
                    render={({ field }: any) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Paint'>Paint</SelectItem>
                          <SelectItem value='Solvents'>Solvents</SelectItem>
                          <SelectItem value='Pesticides'>Pesticides</SelectItem>
                          <SelectItem value='Lighting'>Lighting</SelectItem>
                          <SelectItem value='All'>All</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-category'>Category</Label>
                  <Select
                    key={editForm.watch('category')}
                    value={editForm.watch('category')}
                    onValueChange={(value) => editForm.setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {editForm.watch('category') === 'HSP' ? 'HSP (Hazardous & Special Products)' :
                         editForm.watch('category') === 'EEE' ? 'EEE (Electrical & Electronic Equipment)' :
                         editForm.watch('category') === 'Offset' ? 'Offset' : 'Select Category'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='HSP'>
                        HSP (Hazardous & Special Products)
                      </SelectItem>
                      <SelectItem value='EEE'>
                        EEE (Electrical & Electronic Equipment)
                      </SelectItem>
                      <SelectItem value='Offset'>Offset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-rule-type'>Rule Type</Label>
                  <Select
                    key={editForm.watch('rule_type')}
                    value={editForm.watch('rule_type')}
                    onValueChange={(value) => editForm.setValue('rule_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {editForm.watch('rule_type') === 'Site Requirements' ? 'Site Requirements' :
                         editForm.watch('rule_type') === 'Events' ? 'Events' :
                         editForm.watch('rule_type') === 'Reallocation' ? 'Reallocation' : 'Select Rule Type'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Site Requirements'>
                        Site Requirements
                      </SelectItem>
                      <SelectItem value='Events'>Events</SelectItem>
                      <SelectItem value='Reallocation'>Reallocation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-census-year'>Census Year *</Label>
                  <Select
                    value={editForm.watch('census_year')?.toString()}
                    onValueChange={(value) => editForm.setValue('census_year', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select census year" />
                    </SelectTrigger>
                    <SelectContent>
                      {censusYearsData?.years?.map((year) => (
                        <SelectItem key={year.id} value={year.year.toString()}>
                          {year.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-start-date'>Start Date *</Label>
                  <Input
                    id='edit-start-date'
                    type='date'
                    {...editForm.register('start_date')}
                    className={editForm.formState.errors.start_date ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.start_date && (
                    <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.start_date.message}</p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-end-date'>End Date</Label>
                  <Input
                    id='edit-end-date'
                    type='date'
                    {...editForm.register('end_date')}
                    className={editForm.formState.errors.end_date ? 'border-red-500' : ''}
                  />
                  {editForm.formState.errors.end_date && (
                    <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.end_date.message}</p>
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='edit-description'>Description *</Label>
                <Textarea
                  id='edit-description'
                  {...editForm.register('description')}
                  rows={2}
                  className={editForm.formState.errors.description ? 'border-red-500' : ''}
                />
                {editForm.formState.errors.description && (
                  <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.description.message}</p>
                )}
              </div>

              {/* Dynamic parameter fields based on rule type */}
              <div className='space-y-4 border-t pt-4'>
                <h4 className='font-semibold'>Rule Parameters</h4>

                {editForm.watch('rule_type') === 'Site Requirements' && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Minimum Population</Label>
                      <Input
                        type='number'
                        {...editForm.register('min_population')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>
                        Maximum Population (leave empty for unlimited)
                      </Label>
                      <Input
                        type='number'
                        {...editForm.register('max_population')}
                        placeholder='Unlimited'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Sites Per Population</Label>
                      <Input
                        type='number'
                        {...editForm.register('site_per_population')}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Base Requirement</Label>
                      <Input
                        type='number'
                        {...editForm.register('base_required_sites')}
                      />
                    </div>
                  </div>
                )}

                {editForm.watch('rule_type') === 'Events' && (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label>Maximum Offset Percentage</Label>
                      <Input
                        type='number'
                        min='0'
                        max='100'
                        {...editForm.register('event_offset_percentage')}
                      />
                    </div>
                  </div>
                )}

                {editForm.watch('rule_type') === 'Reallocation' && (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label>Maximum Offset Percentage</Label>
                      <Input
                        type='number'
                        min='0'
                        max='100'
                        {...editForm.register('reallocation_percentage')}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className='flex items-center space-x-2'>
                <input
                  type="checkbox"
                  id='edit-active'
                  {...editForm.register('is_active')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor='edit-active'>Rule is active</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingRuleId(null)
                  editForm.reset()
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Rule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open)
        if (!open) {
          createForm.reset()
        }
      }}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Create Regulatory Rule</DialogTitle>
            <DialogDescription>
              Create a new regulatory rule with all required parameters
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={createForm.handleSubmit(handleCreateRule)} className="space-y-4">
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='create-regulatory-rule'>Regulatory Rule *</Label>
                <Input
                  id='create-regulatory-rule'
                  {...createForm.register('regulatory_rule')}
                  className={createForm.formState.errors.regulatory_rule ? 'border-red-500' : ''}
                />
                {createForm.formState.errors.regulatory_rule && (
                  <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.regulatory_rule.message}</p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='create-program'>Program *</Label>
                <Controller
                  name="program"
                  control={createForm.control}
                  render={({ field }: any) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Paint'>Paint</SelectItem>
                        <SelectItem value='Solvents'>Solvents</SelectItem>
                        <SelectItem value='Pesticides'>Pesticides</SelectItem>
                        <SelectItem value='Lighting'>Lighting</SelectItem>
                        <SelectItem value='All'>All</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='create-category'>Category *</Label>
                <Select
                  key={createForm.watch('category')}
                  value={createForm.watch('category')}
                  onValueChange={(value) => createForm.setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {createForm.watch('category') === 'HSP' ? 'HSP (Hazardous & Special Products)' :
                       createForm.watch('category') === 'EEE' ? 'EEE (Electrical & Electronic Equipment)' :
                       createForm.watch('category') === 'Offset' ? 'Offset' : 'Select Category'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='HSP'>
                      HSP (Hazardous & Special Products)
                    </SelectItem>
                    <SelectItem value='EEE'>
                      EEE (Electrical & Electronic Equipment)
                    </SelectItem>
                    <SelectItem value='Offset'>Offset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='create-rule-type'>Rule Type *</Label>
                <Select
                  key={createForm.watch('rule_type')}
                  value={createForm.watch('rule_type')}
                  onValueChange={(value) => createForm.setValue('rule_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {createForm.watch('rule_type') === 'Site Requirements' ? 'Site Requirements' :
                       createForm.watch('rule_type') === 'Events' ? 'Events' :
                       createForm.watch('rule_type') === 'Reallocation' ? 'Reallocation' : 'Select Rule Type'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Site Requirements'>
                      Site Requirements
                    </SelectItem>
                    <SelectItem value='Events'>Events</SelectItem>
                    <SelectItem value='Reallocation'>Reallocation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='create-census-year'>Census Year *</Label>
                <Select
                  value={createForm.watch('census_year')?.toString()}
                  onValueChange={(value) => createForm.setValue('census_year', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select census year" />
                  </SelectTrigger>
                  <SelectContent>
                    {censusYearsData?.years?.map((year) => (
                      <SelectItem key={year.id} value={year.year.toString()}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='create-start-date'>Start Date *</Label>
                <Input
                  id='create-start-date'
                  type='date'
                  {...createForm.register('start_date')}
                  className={createForm.formState.errors.start_date ? 'border-red-500' : ''}
                />
                {createForm.formState.errors.start_date && (
                  <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.start_date.message}</p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='create-end-date'>End Date</Label>
                <Input
                  id='create-end-date'
                  type='date'
                  {...createForm.register('end_date')}
                  className={createForm.formState.errors.end_date ? 'border-red-500' : ''}
                />
                {createForm.formState.errors.end_date && (
                  <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.end_date.message}</p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='create-description'>Description *</Label>
              <Textarea
                id='create-description'
                {...createForm.register('description')}
                rows={2}
                className={createForm.formState.errors.description ? 'border-red-500' : ''}
              />
              {createForm.formState.errors.description && (
                <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.description.message}</p>
              )}
            </div>

            {/* Dynamic parameter fields based on rule type */}
            <div className='space-y-4 border-t pt-4'>
              <h4 className='font-semibold'>Rule Parameters</h4>

              {createForm.watch('rule_type') === 'Site Requirements' && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Minimum Population</Label>
                    <Input
                      type='number'
                      {...createForm.register('min_population')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>
                      Maximum Population (leave empty for unlimited)
                    </Label>
                    <Input
                      type='number'
                      {...createForm.register('max_population')}
                      placeholder='Unlimited'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Sites Per Population</Label>
                    <Input
                      type='number'
                      step="0.01"
                      {...createForm.register('site_per_population')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Base Requirement</Label>
                    <Input
                      type='number'
                      {...createForm.register('base_required_sites')}
                    />
                  </div>
                </div>
              )}

              {createForm.watch('rule_type') === 'Events' && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Maximum Offset Percentage</Label>
                    <Input
                      type='number'
                      min='0'
                      max='100'
                      {...createForm.register('event_offset_percentage')}
                    />
                  </div>
                </div>
              )}

              {createForm.watch('rule_type') === 'Reallocation' && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Maximum Offset Percentage</Label>
                    <Input
                      type='number'
                      min='0'
                      max='100'
                      {...createForm.register('reallocation_percentage')}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type="checkbox"
                id='create-active'
                {...createForm.register('is_active')}
                className="rounded border-gray-300"
              />
              <Label htmlFor='create-active'>Rule is active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false)
                createForm.reset()
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
