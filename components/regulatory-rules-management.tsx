'use client'

import { useState, useEffect } from 'react'
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
import { Edit, CheckCircle, Plus, Info, Trash2 } from 'lucide-react'
import type { RegulatoryRule } from '@/lib/supabase'
import * as api from '@/lib/api'

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

export default function RegulatoryRulesManagement({
  currentUser,
}: RegulatoryRulesManagementProps) {
  const [rules, setRules] = useState<RegulatoryRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<RegulatoryRule | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRule, setNewRule] = useState<Partial<RegulatoryRule>>({
    program: 'Paint',
    category: 'HSP',
    rule_type: 'site_calculation',
    name: '',
    description: '',
    parameters: {},
    status: 'Active',
  })
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedRuleType, setSelectedRuleType] = useState('all')

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      console.log('[v0] Fetching regulatory rules...')
      setLoading(true)

      const data = await api.compliance.regulatoryRules.list()

      console.log(
        '[v0] Successfully fetched',
        data?.length || 0,
        'regulatory rules',
      )
      setRules(data || [])
    } catch (error) {
      console.error('[v0] Failed to load regulatory rules:', error)
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  const filteredRules = rules.filter((rule) => {
    const programMatch =
      selectedProgram === 'all' ||
      rule.program === selectedProgram ||
      rule.program === 'All'
    const categoryMatch =
      selectedCategory === 'all' ||
      rule.category === selectedCategory ||
      rule.category === 'Offset'
    const ruleTypeMatch =
      selectedRuleType === 'all' || rule.rule_type === selectedRuleType
    return programMatch && categoryMatch && ruleTypeMatch
  })

  const handleEditRule = (rule: RegulatoryRule) => {
    setEditingRule({ ...rule })
    setIsEditDialogOpen(true)
  }

  const handleSaveRule = async () => {
    if (!editingRule) return

    try {
      await api.compliance.regulatoryRules.update(editingRule.id, {
        name: editingRule.name,
        description: editingRule.description,
        program: editingRule.program,
        category: editingRule.category,
        rule_type: editingRule.rule_type,
        parameters: editingRule.parameters,
        status: editingRule.status,
      })

      setRules(rules.map((r) => (r.id === editingRule.id ? editingRule : r)))
      setIsEditDialogOpen(false)
      setEditingRule(null)
    } catch (error) {
      console.error('[v0] Error updating rule:', error)
      alert('Failed to update rule. Please try again.')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      await api.compliance.regulatoryRules.delete(ruleId)

      setRules(rules.filter((r) => r.id !== ruleId))
    } catch (error) {
      console.error('[v0] Error deleting rule:', error)
      alert('Failed to delete rule. Please try again.')
    }
  }

  const handleAddNewRule = () => {
    setNewRule({
      program: 'Paint',
      category: 'HSP',
      rule_type: 'site_calculation',
      name: '',
      description: '',
      parameters: {
        applicableGeographicTypes: ['local_municipality'],
        minPopulation: 0,
        maxPopulation: null,
        roundUpPortion: true,
      },
      status: 'Active',
    })
    setIsAddDialogOpen(true)
  }

  const handleSaveNewRule = async () => {
    if (!newRule.name || !newRule.description) {
      alert('Please fill in all required fields (Name and Description)')
      return
    }

    try {
      const data = await api.compliance.regulatoryRules.create(
        newRule as Omit<RegulatoryRule, 'id' | 'created_at' | 'updated_at'>,
      )

      if (data) {
        setRules([...rules, data])
        setIsAddDialogOpen(false)
        setNewRule({
          program: 'Paint',
          category: 'HSP',
          rule_type: 'site_calculation',
          name: '',
          description: '',
          parameters: {},
          status: 'Active',
        })
      }
    } catch (error) {
      console.error('[v0] Error saving new regulatory rule:', error)
      alert('Failed to save new rule. Please try again.')
    }
  }

  const handleNewRuleTypeChange = (ruleType: string) => {
    let defaultParams: RuleParameters = {}

    switch (ruleType) {
      case 'site_calculation':
        defaultParams = {
          applicableGeographicTypes: ['local_municipality'],
          minPopulation: 0,
          maxPopulation: null,
          sitesPerPopulation: 40000,
          roundUpPortion: true,
          formula: 'CEILING(population / sitesPerPopulation)',
        }
        break
      case 'minimum_requirement':
        defaultParams = {
          applicableGeographicTypes: ['territorial_district'],
          minPopulation: 1000,
          minimumSites: 1,
        }
        break
      case 'offset_event':
        defaultParams = {
          maxOffsetPercentage: 35,
          applicablePrograms: ['Paint', 'Pesticides', 'Solvents', 'Lighting'],
          description: 'Events can offset site requirements up to 35%',
        }
        break
      case 'offset_adjacent':
        defaultParams = {
          maxOffsetPercentage: 10,
          applicablePrograms: ['Paint', 'Pesticides', 'Solvents', 'Lighting'],
          excludedOperatorTypes: ['Municipal', 'Regional', 'First_Nations'],
          requiresAdjacency: true,
          description:
            'Adjacent community sharing up to 10%, excluding Municipal/Regional/First Nations operators',
        }
        break
    }

    setNewRule({
      ...newRule,
      rule_type: ruleType,
      parameters: defaultParams,
    })
  }

  const renderRuleParameters = (rule: RegulatoryRule) => {
    const params = rule.parameters as RuleParameters

    if (rule.rule_type === 'site_calculation') {
      return (
        <div className='space-y-1 text-sm'>
          {params.applicableGeographicTypes && (
            <div>
              <span className='font-medium'>Geographic Types:</span>{' '}
              {params.applicableGeographicTypes.join(', ')}
            </div>
          )}
          {params.minPopulation !== undefined && (
            <div>
              <span className='font-medium'>Min Population:</span>{' '}
              {params.minPopulation.toLocaleString()}
            </div>
          )}
          {params.maxPopulation !== null &&
            params.maxPopulation !== undefined && (
              <div>
                <span className='font-medium'>Max Population:</span>{' '}
                {params.maxPopulation.toLocaleString()}
              </div>
            )}
          {params.sitesPerPopulation && (
            <div>
              <span className='font-medium'>Sites Per:</span>{' '}
              {params.sitesPerPopulation.toLocaleString()} people
            </div>
          )}
          {params.baseRequirement && (
            <div>
              <span className='font-medium'>Base Sites:</span>{' '}
              {params.baseRequirement}
            </div>
          )}
          {params.additionalPerPopulation && (
            <div>
              <span className='font-medium'>Additional Per:</span>{' '}
              {params.additionalPerPopulation.toLocaleString()} people
            </div>
          )}
          {params.formula && (
            <div className='text-xs text-muted-foreground mt-1'>
              <span className='font-medium'>Formula:</span> {params.formula}
            </div>
          )}
        </div>
      )
    }

    if (rule.rule_type === 'minimum_requirement') {
      return (
        <div className='space-y-1 text-sm'>
          {params.applicableGeographicTypes && (
            <div>
              <span className='font-medium'>Geographic Types:</span>{' '}
              {params.applicableGeographicTypes.join(', ')}
            </div>
          )}
          {params.minPopulation !== undefined && (
            <div>
              <span className='font-medium'>Min Population:</span>{' '}
              {params.minPopulation.toLocaleString()}
            </div>
          )}
          {params.minimumSites && (
            <div>
              <span className='font-medium'>Minimum Sites:</span>{' '}
              {params.minimumSites}
            </div>
          )}
        </div>
      )
    }

    if (
      rule.rule_type === 'offset_event' ||
      rule.rule_type === 'offset_adjacent'
    ) {
      return (
        <div className='space-y-1 text-sm'>
          {params.maxOffsetPercentage !== undefined && (
            <div>
              <span className='font-medium'>Max Offset:</span>{' '}
              {params.maxOffsetPercentage}%
            </div>
          )}
          {params.applicablePrograms && (
            <div>
              <span className='font-medium'>Programs:</span>{' '}
              {params.applicablePrograms.join(', ')}
            </div>
          )}
          {params.excludedOperatorTypes && (
            <div>
              <span className='font-medium'>Excluded Operators:</span>{' '}
              {params.excludedOperatorTypes.join(', ')}
            </div>
          )}
          {params.requiresAdjacency && (
            <div className='text-xs text-muted-foreground'>
              <CheckCircle className='inline h-3 w-3 mr-1' />
              Requires geographic adjacency
            </div>
          )}
        </div>
      )
    }

    return (
      <div className='text-sm text-muted-foreground'>No parameters defined</div>
    )
  }

  const getRuleTypeBadgeColor = (ruleType: string) => {
    switch (ruleType) {
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

  const ruleStats = {
    total: rules.length,
    active: rules.filter((r) => r.status === 'Active').length,
    siteCalculation: rules.filter((r) => r.rule_type === 'site_calculation')
      .length,
    offsetRules: rules.filter((r) => r.rule_type.startsWith('offset_')).length,
    programs: new Set(rules.map((r) => r.program)).size,
  }

  return (
    <div className='space-y-6'>
      {/* Header with Stats */}
      <div className='grid gap-4 md:grid-cols-3 xl:grid-cols-5'>
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
      </div>

      {/* Main Rules Table */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-end'>
            <Button onClick={handleAddNewRule} className='gap-2'>
              <Plus className='h-4 w-4' />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='space-y-2'>
              <Label>Filter by Program</Label>
              <Select
                value={selectedProgram}
                onValueChange={setSelectedProgram}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='Paint'>Paint</SelectItem>
                  <SelectItem value='Solvents'>Solvents</SelectItem>
                  <SelectItem value='Pesticides'>Pesticides</SelectItem>
                  <SelectItem value='Lighting'>Lighting</SelectItem>
                  <SelectItem value='All'>All (Offsets)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Filter by Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='HSP'>
                    HSP (Hazardous & Special Products)
                  </SelectItem>
                  <SelectItem value='EEE'>
                    EEE (Electrical & Electronic Equipment)
                  </SelectItem>
                  <SelectItem value='Offset'>Offset Rules</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Filter by Rule Type</Label>
              <Select
                value={selectedRuleType}
                onValueChange={setSelectedRuleType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='site_calculation'>
                    Site Calculation
                  </SelectItem>
                  <SelectItem value='minimum_requirement'>
                    Minimum Requirement
                  </SelectItem>
                  <SelectItem value='offset_event'>Event Offset</SelectItem>
                  <SelectItem value='offset_adjacent'>
                    Adjacent Community Offset
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rules Table */}
          {loading ? (
            <div className='text-center py-8 text-muted-foreground'>
              Loading regulatory rules...
            </div>
          ) : filteredRules.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No rules found matching the current filters
            </div>
          ) : (
            <div className='border rounded-lg'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRules.map((rule) => (
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
                      <TableCell className='max-w-md whitespace-nowrap'>
                        {renderRuleParameters(rule)}
                      </TableCell>
                      <TableCell>
                        {rule.status === 'Active' ? (
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
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Edit Regulatory Rule</DialogTitle>
            <DialogDescription>
              Modify rule parameters and settings
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-name'>Rule Name</Label>
                  <Input
                    id='edit-name'
                    value={editingRule.name}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, name: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit-program'>Program</Label>
                  <Select
                    value={editingRule.program}
                    onValueChange={(value) =>
                      setEditingRule({ ...editingRule, program: value })
                    }
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
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='edit-description'>Description</Label>
                <Textarea
                  id='edit-description'
                  value={editingRule.description}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              {/* Dynamic parameter fields based on rule type */}
              <div className='space-y-4 border-t pt-4'>
                <h4 className='font-semibold'>Rule Parameters</h4>

                {editingRule.rule_type === 'site_calculation' && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Minimum Population</Label>
                      <Input
                        type='number'
                        value={
                          (editingRule.parameters as RuleParameters)
                            .minPopulation || 0
                        }
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            parameters: {
                              ...editingRule.parameters,
                              minPopulation:
                                Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>
                        Maximum Population (leave empty for unlimited)
                      </Label>
                      <Input
                        type='number'
                        value={
                          (editingRule.parameters as RuleParameters)
                            .maxPopulation || ''
                        }
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            parameters: {
                              ...editingRule.parameters,
                              maxPopulation: e.target.value
                                ? Number.parseInt(e.target.value)
                                : null,
                            },
                          })
                        }
                        placeholder='Unlimited'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Sites Per Population</Label>
                      <Input
                        type='number'
                        value={
                          (editingRule.parameters as RuleParameters)
                            .sitesPerPopulation || ''
                        }
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            parameters: {
                              ...editingRule.parameters,
                              sitesPerPopulation:
                                Number.parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Base Requirement</Label>
                      <Input
                        type='number'
                        value={
                          (editingRule.parameters as RuleParameters)
                            .baseRequirement || ''
                        }
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            parameters: {
                              ...editingRule.parameters,
                              baseRequirement:
                                Number.parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Additional Per Population</Label>
                      <Input
                        type='number'
                        value={
                          (editingRule.parameters as RuleParameters)
                            .additionalPerPopulation || ''
                        }
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            parameters: {
                              ...editingRule.parameters,
                              additionalPerPopulation:
                                Number.parseInt(e.target.value) || undefined,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {editingRule.rule_type === 'minimum_requirement' && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Minimum Population</Label>
                      <Input
                        type='number'
                        value={
                          (editingRule.parameters as RuleParameters)
                            .minPopulation || 0
                        }
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            parameters: {
                              ...editingRule.parameters,
                              minPopulation:
                                Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Minimum Sites Required</Label>
                      <Input
                        type='number'
                        value={
                          (editingRule.parameters as RuleParameters)
                            .minimumSites || 1
                        }
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            parameters: {
                              ...editingRule.parameters,
                              minimumSites:
                                Number.parseInt(e.target.value) || 1,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {(editingRule.rule_type === 'offset_event' ||
                  editingRule.rule_type === 'offset_adjacent') && (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label>Maximum Offset Percentage</Label>
                      <Input
                        type='number'
                        min='0'
                        max='100'
                        value={
                          (editingRule.parameters as RuleParameters)
                            .maxOffsetPercentage || 0
                        }
                        onChange={(e) =>
                          setEditingRule({
                            ...editingRule,
                            parameters: {
                              ...editingRule.parameters,
                              maxOffsetPercentage:
                                Number.parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className='flex items-center space-x-2'>
                <Switch
                  id='edit-active'
                  checked={editingRule.status === 'Active'}
                  onCheckedChange={(checked) =>
                    setEditingRule({
                      ...editingRule,
                      status: checked ? 'Active' : 'Inactive',
                    })
                  }
                />
                <Label htmlFor='edit-active'>Rule is active</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Rule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Add New Regulatory Rule</DialogTitle>
            <DialogDescription>
              Create a new rule for site calculations, minimums, or offsets
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='new-name'>Rule Name *</Label>
                <Input
                  id='new-name'
                  value={newRule.name}
                  onChange={(e) =>
                    setNewRule({ ...newRule, name: e.target.value })
                  }
                  placeholder='e.g., Paint - Local Municipality (5K-500K)'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='new-program'>Program</Label>
                <Select
                  value={newRule.program}
                  onValueChange={(value) =>
                    setNewRule({ ...newRule, program: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Paint'>Paint</SelectItem>
                    <SelectItem value='Solvents'>Solvents</SelectItem>
                    <SelectItem value='Pesticides'>Pesticides</SelectItem>
                    <SelectItem value='Lighting'>Lighting</SelectItem>
                    <SelectItem value='All'>All (for offsets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='new-category'>Category</Label>
                <Select
                  value={newRule.category}
                  onValueChange={(value) =>
                    setNewRule({ ...newRule, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor='new-rule-type'>Rule Type</Label>
                <Select
                  value={newRule.rule_type}
                  onValueChange={handleNewRuleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='site_calculation'>
                      Site Calculation
                    </SelectItem>
                    <SelectItem value='minimum_requirement'>
                      Minimum Requirement
                    </SelectItem>
                    <SelectItem value='offset_event'>
                      Event Offset (35%)
                    </SelectItem>
                    <SelectItem value='offset_adjacent'>
                      Adjacent Community Offset (10%)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='new-description'>Description *</Label>
              <Textarea
                id='new-description'
                value={newRule.description}
                onChange={(e) =>
                  setNewRule({ ...newRule, description: e.target.value })
                }
                rows={2}
                placeholder='Describe the rule and its purpose'
              />
            </div>

            {/* Dynamic parameter fields based on selected rule type */}
            <div className='space-y-4 border-t pt-4'>
              <h4 className='font-semibold'>Rule Parameters</h4>

              {newRule.rule_type === 'site_calculation' && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Minimum Population</Label>
                    <Input
                      type='number'
                      value={
                        (newRule.parameters as RuleParameters)?.minPopulation ||
                        0
                      }
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            minPopulation: Number.parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>
                      Maximum Population (leave empty for unlimited)
                    </Label>
                    <Input
                      type='number'
                      value={
                        (newRule.parameters as RuleParameters)?.maxPopulation ||
                        ''
                      }
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            maxPopulation: e.target.value
                              ? Number.parseInt(e.target.value)
                              : null,
                          },
                        })
                      }
                      placeholder='Unlimited'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Sites Per Population</Label>
                    <Input
                      type='number'
                      value={
                        (newRule.parameters as RuleParameters)
                          ?.sitesPerPopulation || ''
                      }
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            sitesPerPopulation:
                              Number.parseInt(e.target.value) || undefined,
                          },
                        })
                      }
                      placeholder='e.g., 40000 for Paint'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Base Requirement (optional)</Label>
                    <Input
                      type='number'
                      value={
                        (newRule.parameters as RuleParameters)
                          ?.baseRequirement || ''
                      }
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            baseRequirement:
                              Number.parseInt(e.target.value) || undefined,
                          },
                        })
                      }
                      placeholder='e.g., 13 for &gt;500K'
                    />
                  </div>
                </div>
              )}

              {newRule.rule_type === 'minimum_requirement' && (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Minimum Population</Label>
                    <Input
                      type='number'
                      value={
                        (newRule.parameters as RuleParameters)?.minPopulation ||
                        1000
                      }
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            minPopulation:
                              Number.parseInt(e.target.value) || 1000,
                          },
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Minimum Sites Required</Label>
                    <Input
                      type='number'
                      value={
                        (newRule.parameters as RuleParameters)?.minimumSites ||
                        1
                      }
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            minimumSites: Number.parseInt(e.target.value) || 1,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {(newRule.rule_type === 'offset_event' ||
                newRule.rule_type === 'offset_adjacent') && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Maximum Offset Percentage</Label>
                    <Input
                      type='number'
                      min='0'
                      max='100'
                      value={
                        (newRule.parameters as RuleParameters)
                          ?.maxOffsetPercentage || 0
                      }
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          parameters: {
                            ...newRule.parameters,
                            maxOffsetPercentage:
                              Number.parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <Alert>
                    <Info className='h-4 w-4' />
                    <AlertDescription>
                      {newRule.rule_type === 'offset_event'
                        ? 'Event offsets allow temporary collection events to count toward site requirements up to 35%'
                        : 'Adjacent community offsets allow sharing surplus sites with neighboring communities up to 10%, excluding Municipal/Regional/First Nations operators'}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewRule}>Create Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
