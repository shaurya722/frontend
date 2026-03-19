import React, { useState, useEffect } from 'react'
import { useCensusYears, useCommunityDropdown } from '@/features/communities/hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export const SITE_PROGRAMS = ['Paint', 'Lights', 'Solvents', 'Pesticides', 'Fertilizers'] as const
export type SiteProgram = typeof SITE_PROGRAMS[number]
type ProgramSchedule = {
  start_date: string
  end_date: string
}
export type ProgramSchedules = Record<SiteProgram, ProgramSchedule>

const createEmptyProgramSchedules = (): ProgramSchedules =>
  SITE_PROGRAMS.reduce((acc, program) => {
    acc[program] = { start_date: '', end_date: '' }
    return acc
  }, {} as ProgramSchedules)

const cloneProgramSchedules = (schedules?: ProgramSchedules): ProgramSchedules => {
  const source = schedules || createEmptyProgramSchedules()
  return SITE_PROGRAMS.reduce((acc, program) => {
    acc[program] = {
      start_date: source[program]?.start_date || '',
      end_date: source[program]?.end_date || '',
    }
    return acc
  }, {} as ProgramSchedules)
}

const createDefaultCollectionSite = (): CollectionSite => ({
  name: '',
  service_partner: '',
  site_type: '',
  operator_type: '',
  address: '',
  municipality_id: '',
  census_year: undefined,
  status: 'Active',
  address_line1: '',
  address_line2: '',
  city: '',
  state_province: '',
  postal_code: '',
  community: '',
  region_district: '',
  service_area: undefined,
  latitude: 0,
  longitude: 0,
  site_start_date: '',
  site_end_date: '',
  programs: [],
  programSchedules: createEmptyProgramSchedules(),
  materials_collected: [],
  collection_scope: [],
})

// Types
export interface CollectionSite {
  id?: string
  name: string
  service_partner?: string
  site_type: string
  operator_type: string
  address: string
  municipality_id?: string
  census_year?: number
  status: 'Active' | 'Inactive' | 'Scheduled'
  // Location fields
  address_line1?: string
  address_line2?: string
  city?: string
  state_province?: string
  postal_code?: string
  community?: string
  region_district?: string
  service_area?: number | string
  latitude?: number
  longitude?: number
  site_start_date?: string
  site_end_date?: string
  // Programs and materials
  programs: SiteProgram[]
  programSchedules: ProgramSchedules
  materials_collected: string[]
  collection_scope: string[]
}

type RequiredFieldMeta = { field: keyof CollectionSite; label: string }

const BASIC_REQUIRED_FIELDS: RequiredFieldMeta[] = [
  { field: 'name', label: 'Site name' },
  { field: 'site_type', label: 'Site type' },
  { field: 'operator_type', label: 'Operator type' },
  { field: 'address', label: 'Address' },
  { field: 'municipality_id', label: 'Community' },
]

const LOCATION_REQUIRED_FIELDS: RequiredFieldMeta[] = [
  { field: 'address_line1', label: 'Address line 1' },
  { field: 'city', label: 'City' },
  { field: 'state_province', label: 'State/Province' },
  { field: 'postal_code', label: 'Postal/Zip code' },
  { field: 'community', label: 'Community (census subdivision)' },
]

const getProgramStartDateKey = (program: SiteProgram) => `program-${program}-start_date`

const isEmptyValue = (value: unknown) => {
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  return value === undefined || value === null
}

interface SiteFormDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  site?: CollectionSite | null
  onSubmit: (siteData: CollectionSite) => void
  isLoading?: boolean
}

// Mock data - replace with actual data from your API
const siteTypes = ['Collection Site', 'Event']
const operatorTypes = ['Retailer', 'Distributor', 'Municipal', 'First Nation/Indigenous', 'Private Depot', 'Product Care', 'Regional District', 'Regional Service commission', 'Others']
const statuses = ['Active', 'Inactive']
const materialsServices = [
  'Paint',
  'Light bulbs',
  'Batteries',
  'Oil filters',
  'Tires',
  'Electronics',
  'Household hazardous waste'
]
const collectionSectors = ['Residential', 'Commercial', 'Industrial', 'Institutional']
const onRegionsDistricts = ['District 1', 'District 2', 'District 3'] // Replace with actual regions

interface Municipality {
  id: string
  name: string
}

// Mock municipalities - replace with actual data
const safeMunicipalities: Municipality[] = [
  { id: '1', name: 'Toronto' },
  { id: '2', name: 'Vancouver' },
  { id: '3', name: 'Montreal' },
]

const SiteFormDialog: React.FC<SiteFormDialogProps> = ({
  isOpen,
  onClose,
  mode,
  site,
  onSubmit,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('basic')
  const [newSite, setNewSite] = useState<CollectionSite>(createDefaultCollectionSite())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: censusYears } = useCensusYears()
  const { data: communities, isLoading: communitiesLoading } = useCommunityDropdown(
    censusYears?.years?.find(cy => cy.id === newSite.census_year)?.year
  )
  const { toast } = useToast()

  const hasError = (key: string) => Boolean(errors[key])
  const getFieldClasses = (key: string) =>
    hasError(key) ? 'border-destructive focus-visible:ring-destructive' : undefined
  const renderErrorMessage = (key: string) =>
    errors[key] ? <p className='text-xs text-destructive'>{errors[key]}</p> : null

  const clearError = (key: string) => {
    setErrors(prev => {
      if (!(key in prev)) return prev
      const { [key]: _removed, ...rest } = prev
      return rest
    })
  }

  const validateForm = () => {
    const nextErrors: Record<string, string> = {}
    const markError = (key: string, message: string) => {
      if (!nextErrors[key]) {
        nextErrors[key] = message
      }
    }

    BASIC_REQUIRED_FIELDS.forEach(({ field, label }) => {
      if (isEmptyValue(newSite[field])) {
        markError(field, `${label} is required`)
      }
    })

    LOCATION_REQUIRED_FIELDS.forEach(({ field, label }) => {
      if (isEmptyValue(newSite[field])) {
        markError(field, `${label} is required`)
      }
    })

    if (
      newSite.site_start_date &&
      newSite.site_end_date &&
      new Date(newSite.site_start_date) > new Date(newSite.site_end_date)
    ) {
      markError('site_end_date', 'End date cannot be earlier than the start date')
    }

    newSite.programs.forEach(program => {
      const schedule = newSite.programSchedules[program]
      if (!schedule || isEmptyValue(schedule.start_date)) {
        markError(
          getProgramStartDateKey(program),
          `${program} start date is required when the program is enabled`
        )
      }
    })

    return nextErrors
  }

  // Initialize form data when dialog opens or site changes
  useEffect(() => {
    if (!isOpen) return

    if (site && mode === 'edit') {
      setNewSite({
        ...site,
        programs: [...site.programs],
        programSchedules: cloneProgramSchedules(site.programSchedules),
        materials_collected: [...site.materials_collected],
        collection_scope: [...site.collection_scope],
      })
    } else if (mode === 'add') {
      setNewSite(createDefaultCollectionSite())
    }

    setErrors({})
  }, [isOpen, site, mode])

  const handleProgramChange = (program: SiteProgram, checked: boolean) => {
    const startKey = getProgramStartDateKey(program)
    if (!checked) {
      clearError(startKey)
    }
    setNewSite(prev => {
      const exists = prev.programs.includes(program)
      let nextPrograms: SiteProgram[] = prev.programs

      if (checked && !exists) {
        nextPrograms = [...prev.programs, program]
      } else if (!checked && exists) {
        nextPrograms = prev.programs.filter(p => p !== program)
      }

      const nextSchedules = !checked
        ? {
            ...prev.programSchedules,
            [program]: { start_date: '', end_date: '' },
          }
        : prev.programSchedules

      return {
        ...prev,
        programs: nextPrograms,
        programSchedules: nextSchedules,
      }
    })
  }

  const handleProgramScheduleChange = (program: SiteProgram, field: keyof ProgramSchedule, value: string) => {
    setNewSite(prev => ({
      ...prev,
      programSchedules: {
        ...prev.programSchedules,
        [program]: {
          ...prev.programSchedules[program],
          [field]: value,
        },
      },
    }))
  }

  const handleMaterialChange = (material: string, checked: boolean) => {
    setNewSite(prev => ({
      ...prev,
      materials_collected: checked
        ? [...prev.materials_collected, material]
        : prev.materials_collected.filter(m => m !== material),
    }))
  }

  const handleScopeChange = (scope: string, checked: boolean) => {
    setNewSite(prev => ({
      ...prev,
      collection_scope: checked
        ? [...prev.collection_scope, scope]
        : prev.collection_scope.filter(s => s !== scope),
    }))
  }

  const handleAddSite = () => {
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast({
        variant: 'destructive',
        title: 'Missing required information',
        description: 'Please fill in the highlighted fields before continuing.',
      })
      return
    }

    onSubmit(newSite)
  }

  const handleClose = () => {
    setActiveTab('basic')
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Site' : 'Update Site'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Enter the details for the new collection site'
              : 'Update the collection site information'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='basic'>Basic Information</TabsTrigger>
            <TabsTrigger value='location'>Location</TabsTrigger>
            <TabsTrigger value='programs'>Programs & Materials</TabsTrigger>
          </TabsList>

          <TabsContent value='basic' className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Site Name *</Label>
              <Input
                id='name'
                value={newSite.name}
                className={getFieldClasses('name')}
                onChange={(e) => {
                  clearError('name')
                  setNewSite({ ...newSite, name: e.target.value })
                }}
                placeholder='Enter site name'
                required
              />
              {renderErrorMessage('name')}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='service_partner'>Service Partner</Label>
              <Input
                id='service_partner'
                value={newSite.service_partner}
                onChange={(e) =>
                  setNewSite({
                    ...newSite,
                    service_partner: e.target.value,
                  })
                }
                placeholder='Enter service partner (e.g., link Canadian Tire Toronto with Canadian Tire Markham)'
              />
              <p className='text-xs text-muted-foreground'>
                Link related sites under the same service partner
                (e.g., Canadian Tire Toronto with Canadian Tire Markham)
              </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='type'>Site Type *</Label>
                <Select
                  value={newSite.site_type}
                  onValueChange={(value) => {
                    clearError('site_type')
                    setNewSite({ ...newSite, site_type: value })
                  }}
                >
                  <SelectTrigger className={getFieldClasses('site_type')}>
                    <SelectValue placeholder='Select site type' />
                  </SelectTrigger>
                  <SelectContent>
                    {siteTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderErrorMessage('site_type')}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='operator_type'>Operator Type *</Label>
                <Select
                  value={newSite.operator_type}
                  onValueChange={(value) => {
                    clearError('operator_type')
                    setNewSite({ ...newSite, operator_type: value })
                  }}
                >
                  <SelectTrigger className={getFieldClasses('operator_type')}>
                    <SelectValue placeholder='Select operator type' />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderErrorMessage('operator_type')}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Address *</Label>
              <Input
                id='address'
                value={newSite.address}
                className={getFieldClasses('address')}
                onChange={(e) => {
                  clearError('address')
                  setNewSite({ ...newSite, address: e.target.value })
                }}
                placeholder='Enter complete address'
                required
              />
              {renderErrorMessage('address')}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='census_year'>Census Year</Label>
                <Select
                  value={newSite.census_year?.toString() || ''}
                  onValueChange={(value) =>
                    setNewSite({ ...newSite, census_year: value ? parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select census year' />
                  </SelectTrigger>
                  <SelectContent>
                    {censusYears?.years?.map((censusYear) => (
                      <SelectItem key={censusYear.id} value={censusYear.id.toString()}>
                        {censusYear.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='municipality'>Community *</Label>
                <Select
                  value={newSite.municipality_id}
                  onValueChange={(value) => {
                    clearError('municipality_id')
                    setNewSite({ ...newSite, municipality_id: value })
                  }}
                  disabled={!newSite.census_year || communitiesLoading}
                >
                  <SelectTrigger className={getFieldClasses('municipality_id')}>
                    <SelectValue placeholder={newSite.census_year ? (communitiesLoading ? 'Loading communities...' : 'Select community') : 'Select census year first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {communities?.communities?.map((community: any) => (
                      <SelectItem
                        key={community.id}
                        value={community.id}
                      >
                        {community.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderErrorMessage('municipality_id')}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={newSite.status}
                  onValueChange={(value) =>
                    setNewSite({
                      ...newSite,
                      status: value as CollectionSite['status'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='location' className='space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='address_line1'>Address Line 1 *</Label>
                <Input
                  id='address_line1'
                  value={newSite.address_line1 || ''}
                  className={getFieldClasses('address_line1')}
                  onChange={(e) => {
                    clearError('address_line1')
                    setNewSite({
                      ...newSite,
                      address_line1: e.target.value,
                    })
                  }}
                  placeholder='Street address, P.O. box, etc.'
                  required
                />
                {renderErrorMessage('address_line1')}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='address_line2'>Address Line 2</Label>
                <Input
                  id='address_line2'
                  value={newSite.address_line2 || ''}
                  onChange={(e) =>
                    setNewSite({
                      ...newSite,
                      address_line2: e.target.value,
                    })
                  }
                  placeholder='Apartment, suite, unit, building, floor, etc.'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='city'>City *</Label>
                <Input
                  id='city'
                  value={newSite.city || ''}
                  className={getFieldClasses('city')}
                  onChange={(e) => {
                    clearError('city')
                    setNewSite({ ...newSite, city: e.target.value })
                  }}
                  placeholder='City'
                  required
                />
                {renderErrorMessage('city')}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='state_province'>State/Province *</Label>
                <Input
                  id='state_province'
                  value={newSite.state_province || ''}
                  className={getFieldClasses('state_province')}
                  onChange={(e) => {
                    clearError('state_province')
                    setNewSite({
                      ...newSite,
                      state_province: e.target.value,
                    })
                  }}
                  placeholder='State or Province'
                  required
                />
                {renderErrorMessage('state_province')}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='postal_code'>Postal/Zip Code *</Label>
                <Input
                  id='postal_code'
                  value={newSite.postal_code || ''}
                  className={getFieldClasses('postal_code')}
                  onChange={(e) => {
                    clearError('postal_code')
                    setNewSite({
                      ...newSite,
                      postal_code: e.target.value,
                    })
                  }}
                  placeholder='Postal or ZIP code'
                  required
                />
                {renderErrorMessage('postal_code')}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='community'>Community (Census Subdivision) *</Label>
              <Select
                value={newSite.community}
                onValueChange={(value) => {
                  clearError('community')
                  setNewSite({ ...newSite, community: value })
                }}
              >
                <SelectTrigger className={getFieldClasses('community')}>
                  <SelectValue placeholder='Select community from census data' />
                </SelectTrigger>
                <SelectContent>
                  {safeMunicipalities.map((municipality) => (
                    <SelectItem
                      key={municipality.id}
                      value={municipality.name}
                    >
                      {municipality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderErrorMessage('community')}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='region_district'>Region/District</Label>
              <Select
                value={newSite.region_district}
                onValueChange={(value) =>
                  setNewSite({ ...newSite, region_district: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select region or district' />
                </SelectTrigger>
                <SelectContent>
                  {onRegionsDistricts.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='service_area'>Service Area (ON Zone 1-9)</Label>
              <Select
                value={newSite.service_area?.toString() || ''}
                onValueChange={(value) =>
                  setNewSite({
                    ...newSite,
                    service_area: value
                      ? Number.parseInt(value)
                      : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select service area zone' />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((zone) => (
                    <SelectItem key={zone} value={zone.toString()}>
                      Zone {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='latitude'>Latitude</Label>
                <Input
                  id='latitude'
                  type='number'
                  step='any'
                  value={newSite.latitude}
                  onChange={(e) =>
                    setNewSite({
                      ...newSite,
                      latitude: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder='Enter latitude'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='longitude'>Longitude</Label>
                <Input
                  id='longitude'
                  type='number'
                  step='any'
                  value={newSite.longitude}
                  onChange={(e) =>
                    setNewSite({
                      ...newSite,
                      longitude: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder='Enter longitude'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='site_start_date'>Site Start Date</Label>
                <Input
                  id='site_start_date'
                  type='date'
                  value={newSite.site_start_date || ''}
                  onChange={(e) => {
                    clearError('site_start_date')
                    setNewSite({
                      ...newSite,
                      site_start_date: e.target.value,
                    })
                  }}
                />
                {errors.site_start_date && (
                  <p className='text-xs text-destructive'>{errors.site_start_date}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='site_end_date'>Site End Date</Label>
                <Input
                  id='site_end_date'
                  type='date'
                  value={newSite.site_end_date || ''}
                  onChange={(e) => {
                    clearError('site_end_date')
                    setNewSite({
                      ...newSite,
                      site_end_date: e.target.value,
                    })
                  }}
                />
                {errors.site_end_date && (
                  <p className='text-xs text-destructive'>{errors.site_end_date}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value='programs' className='space-y-4'>
            <div className='space-y-3'>
              <Label className='text-md font-bold'>Programs & Scheduling *</Label>
              <div className='grid grid-cols-1 gap-3'>
                {SITE_PROGRAMS.map((program) => {
                  const isEnabled = newSite.programs.includes(program)
                  const schedule = newSite.programSchedules[program]
                  const startKey = getProgramStartDateKey(program)
                  return (
                    <div key={program} className='rounded-lg border border-gray-200 p-3 space-y-3'>
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id={`program-${program}`}
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            handleProgramChange(program, checked === true)
                          }
                        />
                        <label
                          htmlFor={`program-${program}`}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                        >
                          {program}
                        </label>
                      </div>
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        <div className='space-y-1'>
                          <Label className='text-xs text-muted-foreground'>Start Date *</Label>
                          <Input
                            type='date'
                            value={schedule?.start_date || ''}
                            className={getFieldClasses(startKey)}
                            onChange={(event) => {
                              clearError(startKey)
                              handleProgramScheduleChange(program, 'start_date', event.target.value)
                            }}
                            disabled={!isEnabled}
                          />
                          {isEnabled && renderErrorMessage(startKey)}
                        </div>
                        <div className='space-y-1'>
                          <Label className='text-xs text-muted-foreground'>End Date</Label>
                          <Input
                            type='date'
                            value={schedule?.end_date || ''}
                            onChange={(event) =>
                              handleProgramScheduleChange(program, 'end_date', event.target.value)
                            }
                            disabled={!isEnabled}
                          />
                        </div>
                      </div>
                      {!isEnabled && (
                        <p className='text-xs text-muted-foreground'>Enable {program} to set its schedule.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className='space-y-2'>
              <Label className='text-md font-bold'>Materials Collected/Services</Label>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3'>
                {materialsServices.map((material) => (
                  <div key={material} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`material-${material}`}
                      checked={newSite.materials_collected.includes(material)}
                      onCheckedChange={(checked) =>
                        handleMaterialChange(material, checked === true)
                      }
                    />
                    <label
                      htmlFor={`material-${material}`}
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      {material}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className='space-y-2'>
              <Label className='text-md font-bold'>Collection Sector</Label>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3'>
                {collectionSectors.map((scope) => (
                  <div key={scope} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`scope-${scope}`}
                      checked={newSite.collection_scope.includes(scope)}
                      onCheckedChange={(checked) =>
                        handleScopeChange(scope, checked === true)
                      }
                    />
                    <label
                      htmlFor={`scope-${scope}`}
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      {scope}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAddSite} disabled={isLoading}>
            {isLoading
              ? (mode === 'add' ? 'Adding...' : 'Updating...')
              : (mode === 'add' ? 'Add Site' : 'Update Site')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SiteFormDialog
