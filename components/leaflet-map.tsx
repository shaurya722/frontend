'use client'

import { useEffect, useRef, useState } from 'react'
import type { MapCommunity } from '@/features/map-communities/types'

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface CollectionSite {
  id: string
  name: string
  address: string
  status: string
  operator_type: string
  site_type: string
  latitude: number
  longitude: number
  programs: string[]
  municipality?: { name: string }
  population_served?: number
  created_at?: string
  active_dates?: string
}

interface Municipality {
  id: string
  name: string
  tier: string
  population: number
}

interface MapFilters {
  status: string
  programs: string[]
  municipality: string
  operatorTypes: string[]
  siteTypes: string[]
  performancePeriod: string
  tier: string
  minPopulation: string
  maxPopulation: string
  hasCoordinates: string
  page?: number
  limit?: number
  municipalities_page?: number
  municipalities_limit?: number
}

interface LeafletMapProps {
  sites: CollectionSite[]
  municipalities: Municipality[]
  onSiteClick?: (site: CollectionSite) => void
  onMunicipalityClick?: (municipality: Municipality) => void
  filters?: MapFilters
  layers?: {
    id: string
    name: string
    visible: boolean
    color: string
  }[]
  onPolygonCreate?: (geoJSON: any) => void
  /** Server map communities (GET /api/community/map-communities/) */
  mapCommunities?: MapCommunity[]
  showMapCommunities?: boolean
  /** Fired when user clicks a server-drawn map community polygon */
  onMapCommunityClick?: (community: MapCommunity) => void
}

export default function LeafletMap({
  sites,
  municipalities,
  onSiteClick,
  filters,
  layers,
  onPolygonCreate,
  mapCommunities = [],
  showMapCommunities = true,
  onMapCommunityClick,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const communityLayersRef = useRef<any[]>([])
  const drawnItemsRef = useRef<any>(null)
  const drawControlRef = useRef<any>(null)
  const [leafletReady, setLeafletReady] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = (await import('leaflet')).default
      
      // Dynamically import Leaflet Draw plugin
      await import('leaflet-draw')

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Load Leaflet Draw CSS
      if (!document.querySelector('link[href*="leaflet.draw.css"]')) {
        const drawLink = document.createElement('link')
        drawLink.rel = 'stylesheet'
        drawLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css'
        document.head.appendChild(drawLink)
      }

      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current || mapInstanceRef.current) return

      console.log('[Leaflet] Initializing map...')

      // Initialize map centered on Ontario
      const map = L.map(mapRef.current, {
        // Ensure map doesn't interfere with dialogs
        zoomControl: true,
      }).setView([44.5, -79.5], 6)

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Initialize the FeatureGroup to store editable layers
      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)
      drawnItemsRef.current = drawnItems

      // Add the draw control
      const drawControl = new (L.Control as any).Draw({
        position: 'topright',
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: '<strong>Error:</strong> Shape edges cannot cross!',
            },
            shapeOptions: {
              color: '#3b82f6',
              weight: 3,
              opacity: 0.8,
              fill: true,
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
            },
          },
          polyline: false,
          circle: false,
          rectangle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnItems,
          remove: true,
          edit: true,
        },
      })
      map.addControl(drawControl)
      drawControlRef.current = drawControl

      // Restore saved polygon from localStorage, if any
      try {
        const saved = (typeof window !== 'undefined')
          ? window.localStorage.getItem('drawnPolygon')
          : null
        if (saved) {
          const savedGeom = JSON.parse(saved)
          const restored = L.geoJSON({ type: 'Feature', geometry: savedGeom } as any, {
            style: {
              color: '#3b82f6',
              weight: 3,
              opacity: 0.8,
              fill: true,
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
            },
          })
          restored.eachLayer((layer: any) => {
            drawnItems.addLayer(layer)
          })
          // Fit bounds to restored polygon
          try {
            const bounds = restored.getBounds?.()
            if (bounds) map.fitBounds(bounds.pad(0.1))
          } catch {}
          // Notify parent
          if (onPolygonCreate && savedGeom) {
            onPolygonCreate(savedGeom)
          }
          console.log('Restored polygon from localStorage')
        }
      } catch (e) {
        console.warn('Failed to restore saved polygon', e)
      }

      // Handle polygon creation
      map.on((window as any).L.Draw.Event.CREATED, function (event: any) {
        const layer = event.layer
        const geoJSON = layer.toGeoJSON()
        
        console.log('Polygon created:', geoJSON)
        
        // Add the drawn polygon to the map
        drawnItems.addLayer(layer)
        
        // Call the callback with the GeoJSON geometry
        if (onPolygonCreate) {
          onPolygonCreate(geoJSON.geometry)
        }
        // Persist to localStorage
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('drawnPolygon', JSON.stringify(geoJSON.geometry))
          }
        } catch (e) {
          console.warn('Failed to save polygon', e)
        }
        
        // Optional: Send to backend
        // fetch('/api/community/', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     name: 'Community 1',
        //     boundary: geoJSON.geometry,
        //   }),
        // })
      })

      // Handle polygon deletion
      map.on((window as any).L.Draw.Event.DELETED, function (event: any) {
        const layers = event.layers
        layers.eachLayer(function (layer: any) {
          console.log('Polygon deleted:', layer.toGeoJSON())
        })
        // Clear saved polygon
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('drawnPolygon')
          }
        } catch (e) {
          console.warn('Failed to clear saved polygon', e)
        }
      })

      // Handle polygon edit - update saved geometry
      map.on((window as any).L.Draw.Event.EDITED, function (event: any) {
        const layers = event.layers
        try {
          layers.eachLayer(function (layer: any) {
            const edited = layer.toGeoJSON()?.geometry
            if (edited && typeof window !== 'undefined') {
              window.localStorage.setItem('drawnPolygon', JSON.stringify(edited))
              if (onPolygonCreate) onPolygonCreate(edited)
            }
          })
        } catch (e) {
          console.warn('Failed to save edited polygon', e)
        }
      })

      // Ensure Leaflet controls don't interfere with dialogs
      // Leaflet uses z-index up to 1000, so we need dialogs higher
      if (mapRef.current) {
        const mapContainer = mapRef.current
        // Set a lower z-index for the map container to ensure dialogs appear above
        mapContainer.style.zIndex = '1'
        mapContainer.style.position = 'relative'
      }

      console.log('[Leaflet] Map initialized successfully')
      mapInstanceRef.current = map
      setLeafletReady(true)
    }

    initMap()

    return () => {
      setLeafletReady(false)
      communityLayersRef.current.forEach((layer) => {
        try {
          layer.remove?.()
        } catch {
          /* ignore */
        }
      })
      communityLayersRef.current = []
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !showMapCommunities) {
      if (mapInstanceRef.current && !showMapCommunities) {
        communityLayersRef.current.forEach((layer) => {
          try {
            mapInstanceRef.current?.removeLayer(layer)
          } catch {
            /* ignore */
          }
        })
        communityLayersRef.current = []
      }
      return
    }

    let cancelled = false

    const drawCommunities = async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return
      const map = mapInstanceRef.current
      if (!map || cancelled) return

      communityLayersRef.current.forEach((layer) => {
        try {
          map.removeLayer(layer)
        } catch {
          /* ignore */
        }
      })
      communityLayersRef.current = []

      for (const c of mapCommunities) {
        if (
          !c?.boundary ||
          (c.boundary.type !== 'Polygon' && c.boundary.type !== 'MultiPolygon')
        )
          continue
        const gj = L.geoJSON(
          {
            type: 'Feature',
            geometry: c.boundary,
            properties: { id: c.id, name: c.name },
          } as GeoJSON.GeoJsonObject,
          {
            style: {
              color: '#059669',
              weight: 2,
              opacity: 0.9,
              fillColor: '#10b981',
              fillOpacity: 0.15,
            },
          },
        )
        gj.bindPopup(
          `<div style="min-width:180px"><strong>${escapeHtml(c.name)}</strong><br/><span style="font-size:12px;color:#666">${c.adjacent_ids?.length ?? 0} adjacent communit${(c.adjacent_ids?.length ?? 0) === 1 ? 'y' : 'ies'}</span>${onMapCommunityClick ? `<br/><span style="font-size:11px;color:#059669">Click to edit or delete</span>` : ''}</div>`,
        )
        if (onMapCommunityClick) {
          gj.on('click', () => {
            onMapCommunityClick(c)
          })
        }
        gj.addTo(map)
        communityLayersRef.current.push(gj)
      }
    }

    drawCommunities()

    return () => {
      cancelled = true
      const map = mapInstanceRef.current
      if (map) {
        communityLayersRef.current.forEach((layer) => {
          try {
            map.removeLayer(layer)
          } catch {
            /* ignore */
          }
        })
        communityLayersRef.current = []
      }
    }
  }, [leafletReady, mapCommunities, showMapCommunities, onMapCommunityClick])

  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || !leafletReady)
      return

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default

      // Capture current map instance after async import to avoid races
      const map = mapInstanceRef.current
      if (!map) {
        console.warn('[Leaflet] Map instance missing, skipping marker update')
        return
      }

      console.log('[Leaflet] Updating markers, total sites:', sites.length)

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Sites are already filtered in map-view.tsx, so we use them directly
      // But we can apply additional filtering here if needed for map-specific logic
      const filteredSites = sites

      console.log('[Leaflet] Filtered sites:', filteredSites.length)

      // Check if sites layer is visible
      const sitesLayerVisible =
        layers?.find((l) => l.id === 'sites')?.visible !== false

      // Add markers for filtered sites (only if sites layer is visible)
      if (sitesLayerVisible) {
        filteredSites.forEach((site) => {
          const lat = Number(site.latitude)
          const lng = Number(site.longitude)
          if (
            !isNaN(lat) &&
            !isNaN(lng) &&
            site.latitude != null &&
            site.longitude != null
          ) {
            // Create custom icon based on operator type (matching the legend)
            const getOperatorTypeColor = (operatorType?: string) => {
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

            const color = getOperatorTypeColor(site.operator_type)

            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })

            const marker = L.marker([lat, lng], { icon: customIcon })
              .addTo(map)
              ?.bindPopup(
                `
              <div style="min-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 8px;">${site.name}</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${site.address || 'No address'}</p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>Type:</strong> ${site.site_type || 'Unknown'}</p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>Status:</strong> <span style="color: ${site.status === 'Active' ? 'green' : 'red'};">${site.status || 'Unknown'}</span></p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>Programs:</strong> ${Array.isArray(site.programs) ? site.programs.join(', ') : 'None'}</p>
                <p style="font-size: 12px;"><strong>Population Served:</strong> ${(site.population_served || 0).toLocaleString()}</p>
              </div>
            `,
              )

            if (onSiteClick) {
              marker.on('click', () => onSiteClick(site))
            }

            markersRef.current.push(marker)
          }
        })
      }

      console.log('[Leaflet] Added markers:', markersRef.current.length)

      // Fit map to show all markers if there are any
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current)
        // Re-check map before fitting bounds
        const mapForBounds = mapInstanceRef.current
        if (mapForBounds) {
          mapForBounds.fitBounds(group.getBounds().pad(0.1))
        }
        console.log('[Leaflet] Map bounds fitted to markers')
      }
    }

    updateMarkers()
  }, [leafletReady, sites, municipalities, filters, layers, onSiteClick])

  return (
    <div
      ref={mapRef}
      className='h-[600px] md:h-[400px] 2xl:h-[600px] w-full rounded-lg'
    />
  )
}