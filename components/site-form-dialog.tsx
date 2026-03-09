import React, { useState, useEffect } from 'react'
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
import { Plus } from 'lucide-react'

// Types
export interface CollectionSite {
  id?: string
  name: string
  service_partner?: string
  site_type: string
  operator_type: string
  address: string
  municipality_id?: string
  status: 'Active' | 'Inactive' | 'Scheduled'
  // Location fields
  address_line1?: string
  address_line2?: string
  city?: string
  state_province?: string
  postal_code?: string
  community?: string
  region_district?: string
  service_area?: number
  latitude?: number
  longitude?: number
  active_dates?: string
  // Programs and materials
  programs: string[]
  materials_collected: string[]
  collection_scope: string[]
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
const siteTypes = ['Collection Site', 'Depot', 'Transfer Station', 'Other']
const operatorTypes = ['Municipal', 'Private', 'NGO', 'Community']
const statuses = ['Active', 'Inactive', 'Scheduled']
const programs = ['Paint', 'Lights', 'Solvents', 'Pesticides', 'Fertilizers']
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
  const [newSite, setNewSite] = useState<CollectionSite>({
    name: '',
    service_partner: '',
    site_type: '',
    operator_type: '',
    address: '',
    municipality_id: '',
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
    active_dates: '',
    programs: [],
    materials_collected: [],
    collection_scope: [],
  })

  // Initialize form data when dialog opens or site changes
  useEffect(() => {
    if (isOpen && site && mode === 'edit') {
      setNewSite(site)
    } else if (isOpen && mode === 'add') {
      setNewSite({
        name: '',
        service_partner: '',
        site_type: '',
        operator_type: '',
        address: '',
        municipality_id: '',
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
        active_dates: '',
        programs: [],
        materials_collected: [],
        collection_scope: [],
      })
    }
  }, [isOpen, site, mode])

  const handleProgramChange = (program: string, checked: boolean) => {
    setNewSite(prev => ({
      ...prev,
      programs: checked
        ? [...prev.programs, program]
        : prev.programs.filter(p => p !== program),
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
    onSubmit(newSite)
  }

  const handleClose = () => {
    setActiveTab('basic')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Collection Site' : 'Update Collection Site'}
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
                onChange={(e) =>
                  setNewSite({ ...newSite, name: e.target.value })
                }
                placeholder='Enter site name'
                required
              />
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
                  onValueChange={(value) =>
                    setNewSite({ ...newSite, site_type: value })
                  }
                >
                  <SelectTrigger>
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
              </div>

              <div className='space-y-2'>
                <Label htmlFor='operator_type'>Operator Type *</Label>
                <Select
                  value={newSite.operator_type}
                  onValueChange={(value) =>
                    setNewSite({ ...newSite, operator_type: value })
                  }
                >
                  <SelectTrigger>
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
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Address *</Label>
              <Input
                id='address'
                value={newSite.address}
                onChange={(e) =>
                  setNewSite({ ...newSite, address: e.target.value })
                }
                placeholder='Enter complete address'
                required
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='municipality'>Community *</Label>
                <Select
                  value={newSite.municipality_id}
                  onValueChange={(value) =>
                    setNewSite({ ...newSite, municipality_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select community' />
                  </SelectTrigger>
                  <SelectContent>
                    {safeMunicipalities.map((municipality) => (
                      <SelectItem
                        key={municipality.id}
                        value={municipality.id}
                      >
                        {municipality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onChange={(e) =>
                    setNewSite({
                      ...newSite,
                      address_line1: e.target.value,
                    })
                  }
                  placeholder='Street address, P.O. box, etc.'
                  required
                />
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
                  onChange={(e) =>
                    setNewSite({ ...newSite, city: e.target.value })
                  }
                  placeholder='City'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='state_province'>State/Province *</Label>
                <Input
                  id='state_province'
                  value={newSite.state_province || ''}
                  onChange={(e) =>
                    setNewSite({
                      ...newSite,
                      state_province: e.target.value,
                    })
                  }
                  placeholder='State or Province'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='postal_code'>Postal/Zip Code *</Label>
                <Input
                  id='postal_code'
                  value={newSite.postal_code || ''}
                  onChange={(e) =>
                    setNewSite({
                      ...newSite,
                      postal_code: e.target.value,
                    })
                  }
                  placeholder='Postal or ZIP code'
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='community'>Community (Census Subdivision) *</Label>
              <Select
                value={newSite.community}
                onValueChange={(value) =>
                  setNewSite({ ...newSite, community: value })
                }
              >
                <SelectTrigger>
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

            <div className='space-y-2'>
              <Label htmlFor='active_dates'>Active Dates</Label>
              <Input
                id='active_dates'
                type='date'
                value={newSite.active_dates}
                onChange={(e) =>
                  setNewSite({
                    ...newSite,
                    active_dates: e.target.value,
                  })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value='programs' className='space-y-4'>
            <div className='space-x-2 '>
              <Label className='text-md font-bold'>Programs *</Label>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3'>
                {programs.map((program) => (
                  <div key={program} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`program-${program}`}
                      checked={newSite.programs.includes(program)}
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
                ))}
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
