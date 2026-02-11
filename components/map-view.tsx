'use client'

import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Layers,
  Filter,
  Download,
  Search,
  MapPin,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CollectionSite, Municipality } from '@/lib/supabase'

// Lazy load the Leaflet map component
const LeafletMap = lazy(() => import('./leaflet-map'))

interface MapViewProps {
  sites?: CollectionSite[]
  municipalities?: Municipality[]
}

interface MapLayer {
  id: string
  name: string
  visible: boolean
  color: string
}

export default function MapView({ sites, municipalities }: MapViewProps) {
  // Get current performance year (default to current year)
  const currentYear = new Date().getFullYear()

  const [selectedSite, setSelectedSite] = useState<CollectionSite | null>(null)
  const [selectedLegendType, setSelectedLegendType] = useState<string | null>(
    null,
  )
  const [showLegendInfo, setShowLegendInfo] = useState(false)
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    { id: 'sites', name: 'Collection Sites', visible: true, color: '#3b82f6' },
    {
      id: 'municipalities',
      name: 'Municipality Boundaries',
      visible: true,
      color: '#10b981',
    },
    {
      id: 'population',
      name: 'Population Density',
      visible: false,
      color: '#f59e0b',
    },
  ])
  const [mapFilters, setMapFilters] = useState({
    status: 'all',
    program: 'all',
    municipality: 'all',
    operatorType: 'all',
    siteType: 'all',
    performancePeriod: currentYear.toString(),
  })
  const [searchLocation, setSearchLocation] = useState('')
  const [showPopup, setShowPopup] = useState(false)

  // Safely handle the sites and municipalities arrays with proper null checks
  const safeSites = Array.isArray(sites) ? sites : []

  // Deduplicate municipalities by name (global dataset - one per community)
  // Use useMemo to prevent infinite loops
  const safeMunicipalities = useMemo(() => {
    if (!Array.isArray(municipalities)) return []
    const uniqueMap = new Map<string, Municipality>()
    for (const municipality of municipalities) {
      const key = municipality.name.toLowerCase().trim()
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, municipality)
      }
    }
    return Array.from(uniqueMap.values())
  }, [municipalities])

  // Trigger loading state when data changes
  useEffect(() => {
    if (safeSites.length > 0) {
      setIsMapLoading(true)
      handleMapReady()
    }
  }, [safeSites.length])

  const handleLayerToggle = (layerId: string) => {
    setMapLayers((layers) =>
      layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
      ),
    )
  }

  const handleSiteClick = (site: CollectionSite) => {
    setSelectedSite(site)
    setShowPopup(true)
  }

  const handleLegendClick = (operatorType: string) => {
    const sitesOfType = filteredSites.filter(
      (s) => s.operator_type === operatorType,
    )
    if (sitesOfType.length > 0) {
      setSelectedLegendType(operatorType)
      setShowLegendInfo(true)
    }
  }

  // Simulate map loading completion
  const handleMapReady = () => {
    setTimeout(() => {
      setIsMapLoading(false)
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500'
      case 'Scheduled':
        return 'bg-yellow-500'
      case 'Inactive':
        return 'bg-red-500'
      case 'Pending':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getOperatorTypeColor = (operatorType: string) => {
    switch (operatorType) {
      case 'Retailer':
        return '#3b82f6' // blue-500
      case 'Distributor':
        return '#a855f7' // purple-500
      case 'Municipal':
        return '#14b8a6' // teal-500
      case 'First Nation/Indigenous':
        return '#f59e0b' // amber-500
      case 'Private Depot':
        return '#10b981' // green-500
      case 'Product Care':
        return '#06b6d4' // cyan-500
      case 'Regional District':
        return '#6366f1' // indigo-500
      case 'Regional Service Commission':
        return '#ec4899' // pink-500
      case 'Other':
        return '#6b7280' // gray-500
      default:
        return '#9ca3af' // gray-400
    }
  }

  // Helper function to check if site is active in the current performance year
  const isSiteActiveInYear = (site: CollectionSite, year: number): boolean => {
    // If no active_dates, include by default (sites without date restrictions)
    if (!site.active_dates) return true

    try {
      const dateStr = String(site.active_dates)

      // Handle PostgreSQL DATERANGE format: "[2020-01-01,)" or "[2020-01-01,2023-12-31)" or "(2020-01-01,2023-12-31]"
      // Also handle if it's already a string representation

      // Extract all years from the date range string
      const yearMatches = dateStr.match(/\d{4}/g)

      if (yearMatches && yearMatches.length > 0) {
        const startYear = parseInt(yearMatches[0])
        const endYear = yearMatches.length > 1 ? parseInt(yearMatches[1]) : null

        // Check if current year is within the range
        if (endYear) {
          // Has both start and end year - check if current year is within range
          return year >= startYear && year <= endYear
        } else {
          // Only has start year (open-ended range) - check if current year is >= start year
          return year >= startYear
        }
      }

      // If we can't extract years, try to parse as a date string
      // This handles cases where active_dates might be in a different format
      const dateMatch = dateStr.match(/(\d{4}-\d{2}-\d{2})/)
      if (dateMatch) {
        const date = new Date(dateMatch[1])
        const dateYear = date.getFullYear()
        return year >= dateYear
      }
    } catch (e) {
      // If parsing fails, include the site to avoid filtering out valid data
      console.warn(
        '[MapView] Error parsing active_dates for site:',
        site.name,
        site.active_dates,
        e,
      )
      return true
    }

    // Default: include site if we can't determine (fail open)
    return true
  }

  // Debug: Log initial data
  useEffect(() => {
    if (safeSites.length > 0) {
      console.log('[MapView] Total sites received:', safeSites.length)
      console.log('[MapView] Sample site:', safeSites[0])
      console.log('[MapView] Current year:', currentYear)
      console.log('[MapView] Current filters:', mapFilters)
    }
  }, [safeSites.length, currentYear, mapFilters])

  const filteredSites = safeSites.filter((site) => {
    // Filter by performance period (current year)
    // Temporarily allow all sites if active_dates is null/undefined to debug
    const matchesPerformancePeriod = site.active_dates
      ? isSiteActiveInYear(site, parseInt(mapFilters.performancePeriod))
      : true // Include sites without active_dates

    // Filter by search location
    const matchesSearch =
      !searchLocation ||
      site.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
      site.address?.toLowerCase().includes(searchLocation.toLowerCase()) ||
      site.municipality?.name
        ?.toLowerCase()
        .includes(searchLocation.toLowerCase()) ||
      site.operator_type?.toLowerCase().includes(searchLocation.toLowerCase())

    const matchesStatus =
      mapFilters.status === 'all' || site.status === mapFilters.status
    const sitePrograms = site.programs || []
    const matchesProgram =
      mapFilters.program === 'all' ||
      (Array.isArray(sitePrograms) && sitePrograms.includes(mapFilters.program))
    const matchesMunicipality =
      mapFilters.municipality === 'all' ||
      site.municipality?.name === mapFilters.municipality
    const operatorType = site.operator_type || ''
    const matchesOperatorType =
      mapFilters.operatorType === 'all' ||
      operatorType === mapFilters.operatorType

    const matchesSiteType =
      mapFilters.siteType === 'all' || site.site_type === mapFilters.siteType

    return (
      matchesPerformancePeriod &&
      matchesSearch &&
      matchesStatus &&
      matchesProgram &&
      matchesMunicipality &&
      matchesOperatorType &&
      matchesSiteType
    )
  })

  // Debug: Log filtered results
  useEffect(() => {
    if (safeSites.length > 0) {
      console.log(
        '[MapView] Filtered sites count:',
        filteredSites.length,
        'out of',
        safeSites.length,
      )
      if (filteredSites.length === 0 && safeSites.length > 0) {
        console.warn('[MapView] All sites filtered out! Checking first site:', {
          site: safeSites[0]?.name,
          active_dates: safeSites[0]?.active_dates,
          status: safeSites[0]?.status,
          operator_type: safeSites[0]?.operator_type,
          matchesPerformancePeriod: isSiteActiveInYear(
            safeSites[0],
            currentYear,
          ),
          currentYear,
        })
      }
    }
  }, [filteredSites.length, safeSites.length])

  // Get unique operator types from filtered sites for dynamic legend
  const uniqueOperatorTypes = Array.from(
    new Set(filteredSites.map((s) => s.operator_type).filter(Boolean)),
  ).sort() as string[]

  // Show loading state if data is not yet available
  if (sites === undefined || municipalities === undefined) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-center h-[600px] bg-gray-50 rounded-lg'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading map data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Map Controls Header */}
      <Card>
        <CardContent className='pt-4 pb-4'>
          <div className='flex flex-col gap-4'>
            {/* Filters Row */}
            <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-10 gap-3 items-end'>
              {/* Layer Control */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground invisible md:hidden lg:block'>
                  Layers
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='outline' size='sm' className='h-9 w-full'>
                      <Layers className='w-4 h-4 mr-2' />
                      Layers ({mapLayers.filter((l) => l.visible).length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='w-[95vw] max-w-md'>
                    <DialogHeader>
                      <DialogTitle>Map Layers</DialogTitle>
                      <DialogDescription>
                        Toggle map layers on/off
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                      {mapLayers.map((layer) => (
                        <div
                          key={layer.id}
                          className='flex items-center justify-between'
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className={`w-4 h-4 rounded`}
                              style={{ backgroundColor: layer.color }}
                            />
                            <Label>{layer.name}</Label>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleLayerToggle(layer.id)}
                          >
                            {layer.visible ? (
                              <Eye className='w-4 h-4' />
                            ) : (
                              <EyeOff className='w-4 h-4' />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Status Filter */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground'>Status</Label>
                <Select
                  value={mapFilters.status}
                  onValueChange={(value) =>
                    setMapFilters({ ...mapFilters, status: value })
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent className='z-[100000]'>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Active'>Active</SelectItem>
                    <SelectItem value='Scheduled'>Scheduled</SelectItem>
                    <SelectItem value='Inactive'>Inactive</SelectItem>
                    <SelectItem value='Pending'>Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Program Filter */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground'>Program</Label>
                <Select
                  value={mapFilters.program}
                  onValueChange={(value) =>
                    setMapFilters({ ...mapFilters, program: value })
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Program' />
                  </SelectTrigger>
                  <SelectContent className='z-[100000]'>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Paint'>Paint</SelectItem>
                    <SelectItem value='Lighting'>Lighting</SelectItem>
                    <SelectItem value='Solvents'>Solvents</SelectItem>
                    <SelectItem value='Pesticides'>Pesticides</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Community Filter */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground'>
                  Community
                </Label>
                <Select
                  value={mapFilters.municipality}
                  onValueChange={(value) =>
                    setMapFilters({ ...mapFilters, municipality: value })
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Community' />
                  </SelectTrigger>
                  <SelectContent className='z-[100000]'>
                    <SelectItem value='all'>All</SelectItem>
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

              {/* Operator Type Filter */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground'>
                  Operator Type
                </Label>
                <Select
                  value={mapFilters.operatorType}
                  onValueChange={(value) =>
                    setMapFilters({ ...mapFilters, operatorType: value })
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Operator Type' />
                  </SelectTrigger>
                  <SelectContent className='z-[100000]'>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Retailer'>Retailer</SelectItem>
                    <SelectItem value='Distributor'>Distributor</SelectItem>
                    <SelectItem value='Municipal'>Municipal</SelectItem>
                    <SelectItem value='First Nation/Indigenous'>
                      First Nation/Indigenous
                    </SelectItem>
                    <SelectItem value='Private Depot'>Private Depot</SelectItem>
                    <SelectItem value='Product Care'>Product Care</SelectItem>
                    <SelectItem value='Regional District'>
                      Regional District
                    </SelectItem>
                    <SelectItem value='Regional Service Commission'>
                      Regional Service Commission
                    </SelectItem>
                    <SelectItem value='Other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Site Type Filter */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground'>
                  Site Type
                </Label>
                <Select
                  value={mapFilters.siteType}
                  onValueChange={(value) =>
                    setMapFilters({ ...mapFilters, siteType: value })
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Site Type' />
                  </SelectTrigger>
                  <SelectContent className='z-[100000]'>
                    <SelectItem value='all'>All</SelectItem>
                    <SelectItem value='Collection site'>
                      Collection site
                    </SelectItem>
                    <SelectItem value='Event'>Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Performance Period Filter */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground'>
                  Performance Period
                </Label>
                <Select
                  value={mapFilters.performancePeriod}
                  onValueChange={(value) =>
                    setMapFilters({ ...mapFilters, performancePeriod: value })
                  }
                >
                  <SelectTrigger className='h-9'>
                    <SelectValue placeholder='Year' />
                  </SelectTrigger>
                  <SelectContent className='z-[100000]'>
                    <SelectItem value='2021'>2021</SelectItem>
                    <SelectItem value='2023'>2023</SelectItem>
                    <SelectItem value='2024'>2024</SelectItem>
                    <SelectItem value='2025'>2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground invisible md:hidden lg:block'>
                  Reset
                </Label>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-9 w-full'
                  onClick={() =>
                    setMapFilters({
                      status: 'all',
                      program: 'all',
                      municipality: 'all',
                      operatorType: 'all',
                      siteType: 'all',
                      performancePeriod: currentYear.toString(),
                    })
                  }
                >
                  <RotateCcw className='w-4 h-4 mr-2' />
                  Reset
                </Button>
              </div>

              {/* Search */}
              <div className='space-y-1 col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1'>
                <Label className='text-xs text-muted-foreground'>Search</Label>
                <Input
                  placeholder='Search location...'
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className='h-9'
                />
              </div>

              {/* Export */}
              <div className='space-y-1'>
                <Label className='text-xs text-muted-foreground invisible md:hidden lg:block'>
                  Export
                </Label>
                <Button variant='outline' size='sm' className='h-9 w-full'>
                  <Download className='w-4 h-4 mr-2' />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Map Container */}
      <div className='grid grid-cols-1 2xl:grid-cols-4 gap-4 2xl:gap-6'>
        {/* Map Display */}
        <div className='2xl:col-span-3 order-2 2xl:order-1'>
          <Card>
            <CardContent
              className='p-0 relative'
              style={{ zIndex: 1, isolation: 'isolate' }}
            >
              <Suspense
                fallback={
                  <div className='h-[600px] flex items-center justify-center'>
                    <div className='text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                      <p className='text-gray-600'>Loading map...</p>
                    </div>
                  </div>
                }
              >
                <LeafletMap
                  sites={filteredSites}
                  municipalities={safeMunicipalities}
                  onSiteClick={handleSiteClick}
                  filters={mapFilters}
                  layers={mapLayers}
                />
              </Suspense>

              {/* Loading Overlay */}
              {isMapLoading && (
                <div className='absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-[500] rounded-lg'>
                  <Card className='w-80'>
                    <CardContent className='pt-6'>
                      <div className='text-center space-y-4'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto'></div>
                        <div>
                          <h3 className='font-semibold text-lg mb-2'>
                            Loading Map Data
                          </h3>
                          <p className='text-sm text-gray-600'>
                            Adding{' '}
                            {
                              filteredSites.filter(
                                (s) => s.latitude && s.longitude,
                              ).length
                            }{' '}
                            collection sites to the map...
                          </p>
                        </div>
                        <div className='flex items-center justify-center gap-2 text-xs text-gray-500'>
                          <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse'></div>
                          <span>Initializing OpenStreetMap</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Map Legend Overlay */}
              <div className='absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-lg z-[1000] max-w-xs text-xs'>
                <div className='text-xs font-semibold mb-2'>
                  Legend – Operator Types
                </div>
                <div className='space-y-1'>
                  {uniqueOperatorTypes.length > 0 ? (
                    uniqueOperatorTypes.map((operatorType) => (
                      <div
                        key={operatorType}
                        className='flex items-center gap-1.5 text-xs cursor-pointer hover:bg-gray-50 p-0.5 rounded transition-colors'
                        onClick={() => handleLegendClick(operatorType)}
                      >
                        <div
                          className={`w-2 h-2 rounded-full`}
                          style={{
                            backgroundColor: getOperatorTypeColor(operatorType),
                          }}
                        ></div>
                        <span className='truncate'>{operatorType}</span>
                      </div>
                    ))
                  ) : (
                    <div className='text-xs text-gray-500'>
                      No operator types available
                    </div>
                  )}
                </div>
                <Separator className='my-1.5' />
                <div className='space-y-0.5 text-xs'>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                    <span>
                      Active:{' '}
                      {
                        filteredSites.filter((s) => s.status === 'Active')
                          .length
                      }
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1.5 h-1.5 bg-yellow-500 rounded-full'></div>
                    <span>
                      Scheduled:{' '}
                      {
                        filteredSites.filter((s) => s.status === 'Scheduled')
                          .length
                      }
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1.5 h-1.5 bg-red-500 rounded-full'></div>
                    <span>
                      Inactive:{' '}
                      {
                        filteredSites.filter((s) => s.status === 'Inactive')
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className='space-y-4 order-1 2xl:order-2'>
          {/* Site Information Panel */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                Collection Sites
              </CardTitle>
              <CardDescription>
                {filteredSites.length} sites visible
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 max-h-96 overflow-y-auto'>
              {filteredSites.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <p>No sites match current filters</p>
                  <p className='text-sm'>
                    Adjust map filters to see more sites
                  </p>
                </div>
              ) : (
                filteredSites.slice(0, 8).map((site) => (
                  <div
                    key={site.id}
                    className='border rounded-lg p-3 space-y-2 hover:bg-gray-50 cursor-pointer transition-colors'
                    onClick={() => handleSiteClick(site)}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h4 className='font-medium text-sm'>{site.name}</h4>
                        <p className='text-xs text-gray-600'>{site.address}</p>
                      </div>
                      <Badge
                        className={`${getStatusColor(site.status || '')} text-white border-0`}
                      >
                        {site.status}
                      </Badge>
                    </div>
                    <div className='flex flex-wrap gap-1'>
                      <Badge
                        className='text-white border-0 text-xs'
                        style={{
                          backgroundColor: getOperatorTypeColor(
                            site.operator_type || '',
                          ),
                        }}
                      >
                        {site.operator_type}
                      </Badge>
                      {Array.isArray(site.programs) &&
                        site.programs.slice(0, 2).map((prog, index) => (
                          <Badge
                            key={`${prog}-${index}`}
                            variant='secondary'
                            className='text-xs'
                          >
                            {prog}
                          </Badge>
                        ))}
                      {Array.isArray(site.programs) &&
                        site.programs.length > 2 && (
                          <Badge variant='secondary' className='text-xs'>
                            +{site.programs.length - 2}
                          </Badge>
                        )}
                    </div>
                  </div>
                ))
              )}
              {filteredSites.length > 8 && (
                <div className='text-center text-sm text-gray-500 py-2'>
                  ... and {filteredSites.length - 8} more sites
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community Information Panel */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Communities</CardTitle>
              <CardDescription>
                {safeMunicipalities.length} communities tracked
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3 max-h-64 overflow-y-auto'>
              {safeMunicipalities.slice(0, 6).map((municipality) => (
                <div key={municipality.id} className='border rounded-lg p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-medium text-sm'>{municipality.name}</h4>
                    <Badge variant='outline'>{municipality.tier} Tier</Badge>
                  </div>
                  <div className='text-xs text-gray-600'>
                    <div>
                      Population:{' '}
                      {(municipality.population || 0).toLocaleString()}
                    </div>
                    <div>
                      Sites:{' '}
                      {
                        safeSites.filter(
                          (s) => s.municipality?.name === municipality.name,
                        ).length
                      }
                    </div>
                  </div>
                </div>
              ))}
              {safeMunicipalities.length > 6 && (
                <div className='text-center text-sm text-gray-500'>
                  ... and {safeMunicipalities.length - 6} more communities
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Popup Dialog */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className='w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto]'>
          <DialogHeader>
            <DialogTitle>Collection Site Details</DialogTitle>
          </DialogHeader>
          {selectedSite && (
            <div className='space-y-4'>
              <div>
                <h3 className='font-semibold text-lg'>{selectedSite.name}</h3>
                <p className='text-sm text-gray-600'>{selectedSite.address}</p>
              </div>
              <Separator />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Status</Label>
                  <div className='flex flex-wrap gap-2'>
                    <Badge
                      className={`${getStatusColor(selectedSite.status || '')} text-white border-0`}
                    >
                      {selectedSite.status}
                    </Badge>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Operator Type</Label>
                  <div className='flex flex-wrap gap-2'>
                    <Badge
                      className='text-white border-0'
                      style={{
                        backgroundColor: getOperatorTypeColor(
                          selectedSite.operator_type || '',
                        ),
                      }}
                    >
                      {selectedSite.operator_type}
                    </Badge>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Community</Label>
                  <p className='text-sm'>
                    {selectedSite.municipality?.name || 'Unknown'}
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>
                    Population Served
                  </Label>
                  <p className='text-sm'>
                    {(selectedSite.population_served || 0).toLocaleString()}
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Coordinates</Label>
                  <p className='text-sm text-gray-600'>
                    {selectedSite.latitude != null &&
                    selectedSite.longitude != null
                      ? `${Number(selectedSite.latitude).toFixed(4)}, ${Number(selectedSite.longitude).toFixed(4)}`
                      : 'N/A'}
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>Created</Label>
                  <p className='text-sm text-gray-600'>
                    {selectedSite.created_at
                      ? new Date(selectedSite.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Programs</Label>
                <div className='flex flex-wrap gap-2'>
                  {Array.isArray(selectedSite.programs) &&
                    selectedSite.programs.map((program, index) => (
                      <Badge key={index} variant='secondary'>
                        {program}
                      </Badge>
                    ))}
                  {(!selectedSite.programs ||
                    selectedSite.programs.length === 0) && (
                    <span className='text-sm text-gray-500'>
                      No programs assigned
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Legend Info Dialog */}
      <Dialog open={showLegendInfo} onOpenChange={setShowLegendInfo}>
        <DialogContent className='w-[95vw] max-w-xl'>
          <DialogHeader>
            <DialogTitle>{selectedLegendType} Sites</DialogTitle>
          </DialogHeader>
          {selectedLegendType && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg'>
                <div>
                  <Label className='text-sm font-medium'>Total Sites</Label>
                  <p className='text-2xl font-bold'>
                    {
                      filteredSites.filter(
                        (s) => s.operator_type === selectedLegendType,
                      ).length
                    }
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>On Map</Label>
                  <p className='text-2xl font-bold text-blue-600'>
                    {
                      filteredSites.filter(
                        (s) =>
                          s.operator_type === selectedLegendType &&
                          s.latitude &&
                          s.longitude,
                      ).length
                    }
                  </p>
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium mb-2 block'>
                  Sites List
                </Label>
                <div className='max-h-96 overflow-y-auto space-y-2'>
                  {filteredSites
                    .filter((s) => s.operator_type === selectedLegendType)
                    .slice(0, 10)
                    .map((site) => (
                      <div
                        key={site.id}
                        className='border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors'
                        onClick={() => {
                          setSelectedSite(site)
                          setShowLegendInfo(false)
                          setShowPopup(true)
                        }}
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <h4 className='font-medium text-sm'>{site.name}</h4>
                            <p className='text-xs text-gray-600'>
                              {site.municipality?.name || 'Unknown'}
                            </p>
                          </div>
                          <Badge
                            className={`${getStatusColor(site.status || '')} text-white border-0`}
                          >
                            {site.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
                {filteredSites.filter(
                  (s) => s.operator_type === selectedLegendType,
                ).length > 10 && (
                  <p className='text-sm text-gray-500 text-center mt-2'>
                    ... and{' '}
                    {filteredSites.filter(
                      (s) => s.operator_type === selectedLegendType,
                    ).length - 10}{' '}
                    more sites
                  </p>
                )}
              </div>

              <div className='text-sm text-gray-600 bg-blue-50 p-3 rounded-lg'>
                <strong>Tip:</strong> Click on any site above or on the map
                markers to see detailed information.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
