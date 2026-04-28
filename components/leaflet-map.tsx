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
  /** Fired when a server-rendered community polygon is edited on the map */
  onPolygonEdited?: (id: string, geometry: any) => void
  /** Increment to clear any unsaved client-drawn polygon from the map */
  unsavedPolygonClearedAt?: number
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
  onPolygonEdited,
  unsavedPolygonClearedAt,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const communityLayersRef = useRef<any[]>([])
  const drawnItemsRef = useRef<any>(null)
  const drawControlRef = useRef<any>(null)
  const clientDrawnLayersRef = useRef<any[]>([])
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
            clientDrawnLayersRef.current.push(layer)
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

      // Handle polygon creation with overlap prevention
      map.on((window as any).L.Draw.Event.CREATED, async function (event: any) {
        const layer = event.layer
        const geoJSON = layer.toGeoJSON()

        console.log('Polygon created (candidate):', geoJSON)

        // Helper: fast bounds overlap check
        const boundsOverlap = (a: any, b: any) => {
          try {
            const ab = a.getBounds?.()
            const bb = b.getBounds?.()
            return ab && bb ? ab.intersects(bb) : true
          } catch {
            return true
          }
        }

        // Helpers: basic geometry intersection (Polygon/MultiPolygon) without external deps
        type LngLat = [number, number]
        const toRings = (geom: any): LngLat[][] => {
          if (!geom) return []
          if (geom.type === 'Polygon') return geom.coordinates as LngLat[][]
          if (geom.type === 'MultiPolygon') {
            const out: LngLat[][] = []
            for (const poly of geom.coordinates as LngLat[][][]) out.push(...poly)
            return out
          }
          return []
        }
        const pointInRing = (pt: LngLat, ring: LngLat[]): boolean => {
          // Ray casting in lon/lat space (good enough for small regions)
          let inside = false
          for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1]
            const xj = ring[j][0], yj = ring[j][1]
            const intersect = ((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < (xj - xi) * (pt[1] - yi) / ((yj - yi) || 1e-12) + xi)
            if (intersect) inside = !inside
          }
          return inside
        }
        const onSegment = (a: LngLat, b: LngLat, p: LngLat): boolean => {
          const cross = (p[1]-a[1])*(b[0]-a[0]) - (p[0]-a[0])*(b[1]-a[1])
          if (Math.abs(cross) > 1e-12) return false
          const dot = (p[0]-a[0])*(b[0]-a[0]) + (p[1]-a[1])*(b[1]-a[1])
          if (dot < 0) return false
          const sqLen = (b[0]-a[0])**2 + (b[1]-a[1])**2
          return dot <= sqLen
        }
        const segsIntersect = (p1: LngLat, p2: LngLat, q1: LngLat, q2: LngLat): boolean => {
          const orient = (a: LngLat, b: LngLat, c: LngLat) => Math.sign((b[1]-a[1])*(c[0]-b[0]) - (b[0]-a[0])*(c[1]-b[1]))
          const o1 = orient(p1, p2, q1)
          const o2 = orient(p1, p2, q2)
          const o3 = orient(q1, q2, p1)
          const o4 = orient(q1, q2, p2)
          if (o1 !== o2 && o3 !== o4) return true
          if (o1 === 0 && onSegment(p1, p2, q1)) return true
          if (o2 === 0 && onSegment(p1, p2, q2)) return true
          if (o3 === 0 && onSegment(q1, q2, p1)) return true
          if (o4 === 0 && onSegment(q1, q2, p2)) return true
          return false
        }
        const ringsIntersect = (r1: LngLat[], r2: LngLat[]): boolean => {
          // Edge intersections
          for (let i = 0; i < r1.length - 1; i++) {
            for (let j = 0; j < r2.length - 1; j++) {
              if (segsIntersect(r1[i], r1[i+1], r2[j], r2[j+1])) return true
            }
          }
          // Containment: any vertex of one inside the other
          if (pointInRing(r1[0], r2)) return true
          if (pointInRing(r2[0], r1)) return true
          return false
        }
        const geometriesIntersect = (geomA: any, geomB: any): boolean => {
          const ringsA = toRings(geomA)
          const ringsB = toRings(geomB)
          for (const ra of ringsA) {
            for (const rb of ringsB) {
              if (ringsIntersect(ra, rb)) return true
            }
          }
          return false
        }

        // Collect existing layers: user-drawn and server-rendered communities
        const existingLayers: any[] = []
        try {
          const drawnLayers = drawnItemsRef.current?.getLayers?.() ?? []
          existingLayers.push(...drawnLayers)
        } catch {}
        try {
          existingLayers.push(...communityLayersRef.current)
        } catch {}

        // Check overlap against all existing layers
        for (const existing of existingLayers) {
          try {
            // Quick reject with bounds
            if (!boundsOverlap(layer, existing)) continue

            const existingGj = existing.toGeoJSON?.()
            const existingGeom = existingGj?.geometry
            if (!existingGeom) continue

            const intersects = geometriesIntersect(geoJSON.geometry, existingGeom)
            if (intersects) {
              // Prevent adding overlapping polygon
              try { layer.remove?.() } catch {}
              try {
                // Provide feedback to user
                alert('Cannot add polygon: it overlaps an existing area.')
              } catch {}
              return
            }
          } catch {
            // On any unexpected error, be conservative and block
            try { layer.remove?.() } catch {}
            try { alert('Cannot add polygon due to an internal validation error.') } catch {}
            return
          }
        }

        // Passed overlap checks — add the drawn polygon to the map
        drawnItems.addLayer(layer)
        clientDrawnLayersRef.current.push(layer)

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
      })

      // Handle polygon deletion
      map.on((window as any).L.Draw.Event.DELETED, function (event: any) {
        const layers = event.layers
        layers.eachLayer(function (layer: any) {
          console.log('Polygon deleted:', layer.toGeoJSON())
        })
        clientDrawnLayersRef.current = []
        // Clear saved polygon
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('drawnPolygon')
          }
        } catch (e) {
          console.warn('Failed to clear saved polygon', e)
        }
      })

      // Handle polygon edit - update saved geometry and notify parent (for server polygons)
      map.on((window as any).L.Draw.Event.EDITED, function (event: any) {
        const layers = event.layers
        try {
          layers.eachLayer(function (layer: any) {
            const edited = layer.toGeoJSON()?.geometry
            if (!edited) return
            // If this layer has an id in its feature properties, treat it as a server polygon and notify parent
            const id = layer?.feature?.properties?.id as string | undefined
            if (id && onPolygonEdited) {
              onPolygonEdited(id, edited)
              return
            }
            // Fallback: persist client-drawn polygon
            if (typeof window !== 'undefined') {
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
        // Add to map and also to drawnItems so the edit toolbar can edit server polygons
        gj.addTo(map)
        try {
          gj.eachLayer?.((layer: any) => {
            drawnItemsRef.current?.addLayer?.(layer)
          })
        } catch {}
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

  // Clear unsaved client-drawn polygon when parent signals cancellation
  useEffect(() => {
    if (!unsavedPolygonClearedAt || !leafletReady) return
    try {
      const drawnItems = drawnItemsRef.current
      if (drawnItems) {
        clientDrawnLayersRef.current.forEach((layer) => {
          try {
            drawnItems.removeLayer?.(layer)
          } catch {
            /* ignore */
          }
        })
      }
      clientDrawnLayersRef.current = []
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('drawnPolygon')
      }
    } catch (e) {
      console.warn('Failed to clear unsaved polygon', e)
    }
  }, [unsavedPolygonClearedAt, leafletReady])

  return (
    <div
      ref={mapRef}
      className='h-[600px] md:h-[400px] 2xl:h-[600px] w-full rounded-lg'
    />
  )
}