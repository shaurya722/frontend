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

type LngLat = [number, number]
type Ring = LngLat[]

/**
 * Drop coords that are missing, non-finite, or wrong shape. A valid ring needs
 * at least 3 points; otherwise Leaflet-Draw can't build edit handles and
 * crashes inside `Object.project` with "Cannot read properties of null".
 */
function sanitizeRing(raw: unknown): Ring | null {
  if (!Array.isArray(raw)) return null
  const out: Ring = []
  for (const c of raw) {
    if (!Array.isArray(c) || c.length < 2) continue
    const lng = Number(c[0])
    const lat = Number(c[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    out.push([lng, lat])
  }
  return out.length >= 3 ? out : null
}

/**
 * Normalise a `Polygon` or `MultiPolygon` into a list of polygons, where each
 * polygon is `[outerRing, ...holeRings]`. Used to materialize MultiPolygons as
 * separate `L.Polygon` layers so Leaflet-Draw can edit every sub-polygon.
 */
function geometryToPolygonRings(geom: any): Ring[][] {
  if (!geom) return []
  if (geom.type === 'Polygon') {
    const rings = (geom.coordinates || [])
      .map(sanitizeRing)
      .filter(Boolean) as Ring[]
    return rings.length ? [rings] : []
  }
  if (geom.type === 'MultiPolygon') {
    const out: Ring[][] = []
    for (const poly of geom.coordinates || []) {
      const rings = ((poly as unknown[]) || [])
        .map(sanitizeRing)
        .filter(Boolean) as Ring[]
      if (rings.length) out.push(rings)
    }
    return out
  }
  return []
}

/**
 * Leaflet-Draw 1.0.4 builds "middle" markers between vertices via
 * `_getMiddleLatLng` → `map.project(marker.getLatLng())`. If any vertex is
 * missing/null (bad GeoJSON, corrupted ring, or geoJSON restore), `project`
 * throws `Cannot read properties of null (reading 'lat')`. Patch once per load.
 */
function patchLeafletDrawPolyVertexEdit(L: any) {
  const PVE = L?.Edit?.PolyVerticesEdit
  if (!PVE?.prototype?._getMiddleLatLng) return
  if ((PVE.prototype as any).__arcGisPolyVertexPatched) return
  ;(PVE.prototype as any).__arcGisPolyVertexPatched = true

  const isFlat =
    typeof L.Polyline?._flat === 'function'
      ? L.Polyline._flat.bind(L.Polyline)
      : typeof L.LineUtil?.isFlat === 'function'
        ? L.LineUtil.isFlat.bind(L.LineUtil)
        : null

  const sanitizeFlatRingInPlace = (ring: any[]) => {
    if (!Array.isArray(ring) || !isFlat || !isFlat(ring)) return
    for (let i = ring.length - 1; i >= 0; i--) {
      const ll = ring[i]
      if (
        !ll ||
        typeof ll.lat !== 'number' ||
        typeof ll.lng !== 'number' ||
        !Number.isFinite(ll.lat) ||
        !Number.isFinite(ll.lng)
      ) {
        ring.splice(i, 1)
      }
    }
  }

  const origGetMiddle = PVE.prototype._getMiddleLatLng
  PVE.prototype._getMiddleLatLng = function (marker1: any, marker2: any) {
    if (!marker1 || !marker2) {
      return L.latLng(0, 0)
    }
    let a: any
    let b: any
    try {
      a = typeof marker1.getLatLng === 'function' ? marker1.getLatLng() : null
      b = typeof marker2.getLatLng === 'function' ? marker2.getLatLng() : null
    } catch {
      return L.latLng(0, 0)
    }
    if (
      !a ||
      !b ||
      !Number.isFinite(a.lat) ||
      !Number.isFinite(a.lng) ||
      !Number.isFinite(b.lat) ||
      !Number.isFinite(b.lng)
    ) {
      return L.latLng(
        ((Number(a?.lat) || 0) + (Number(b?.lat) || 0)) / 2,
        ((Number(a?.lng) || 0) + (Number(b?.lng) || 0)) / 2,
      )
    }
    try {
      return origGetMiddle.call(this, marker1, marker2)
    } catch {
      return L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2)
    }
  }

  const origCreateMiddle = PVE.prototype._createMiddleMarker
  PVE.prototype._createMiddleMarker = function (marker1: any, marker2: any) {
    if (!marker1 || !marker2) return
    let a: any
    let b: any
    try {
      a = marker1.getLatLng?.()
      b = marker2.getLatLng?.()
    } catch {
      return
    }
    if (
      !a ||
      !b ||
      !Number.isFinite(a.lat) ||
      !Number.isFinite(a.lng) ||
      !Number.isFinite(b.lat) ||
      !Number.isFinite(b.lng)
    ) {
      return
    }
    return origCreateMiddle.call(this, marker1, marker2)
  }

  const origInitMarkers = PVE.prototype._initMarkers
  PVE.prototype._initMarkers = function () {
    try {
      sanitizeFlatRingInPlace(this._latlngs)
    } catch {
      /* ignore */
    }
    return origInitMarkers.call(this)
  }
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
  boundary?: any
  adjacent_ids?: string[]
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
  /** If provided, focuses/zooms to a community whose name includes this term */
  focusCommunityName?: string
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
  focusCommunityName,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const communityLayersRef = useRef<any[]>([])
  const municipalityLayersRef = useRef<any[]>([])
  const drawnItemsRef = useRef<any>(null)
  const drawControlRef = useRef<any>(null)
  const clientDrawnLayersRef = useRef<any[]>([])
  /** Map<featureId, L.Polygon[]> — used to re-aggregate decomposed MultiPolygons on edit */
  const polygonsByFeatureIdRef = useRef<Map<string, any[]>>(new Map())
  const [leafletReady, setLeafletReady] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = (await import('leaflet')).default
      
      // Dynamically import Leaflet Draw plugin (extends L)
      await import('leaflet-draw')
      patchLeafletDrawPolyVertexEdit(L)
      // Compatibility shim for plugins expecting LineUtil._flat
      try {
        const LU: any = (L as any).LineUtil
        if (LU && !LU._flat && typeof LU.isFlat === 'function') {
          LU._flat = LU.isFlat
        }
      } catch {
        /* ignore */
      }
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

      // Defensive: hide the delete (trash) tool from the edit toolbar even if a
      // future build re-enables it; keeps Edit visible while removing Delete.
      if (!document.getElementById('leaflet-draw-no-delete-style')) {
        const style = document.createElement('style')
        style.id = 'leaflet-draw-no-delete-style'
        style.textContent = `
          .leaflet-draw-edit-remove { display: none !important; }
        `
        document.head.appendChild(style)
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

      // Add the draw control (delete icon intentionally disabled)
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
          remove: false,
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
          const ringSets = geometryToPolygonRings(savedGeom)
          if (ringSets.length) {
            for (const rings of ringSets) {
              const latlngs = rings.map((r) => r.map(([lng, lat]) => L.latLng(lat, lng)))
              const restored = L.polygon(latlngs, {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.8,
                fill: true,
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
              })
              drawnItems.addLayer(restored)
              clientDrawnLayersRef.current.push(restored)
            }
            try {
              const group = L.featureGroup(clientDrawnLayersRef.current)
              const bounds = group.getBounds?.()
              if (bounds && bounds.isValid && bounds.isValid()) {
                map.fitBounds(bounds.pad(0.1))
              }
            } catch (e) {
              console.warn('[Leaflet] Failed to fit bounds to restored polygon:', e)
            }
            if (onPolygonCreate && savedGeom) {
              onPolygonCreate(savedGeom)
            }
            console.log('Restored polygon from localStorage')
          } else {
            try {
              window.localStorage.removeItem('drawnPolygon')
            } catch {
              /* ignore */
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore saved polygon', e)
      }

      // Handle polygon creation (overlapping areas are allowed)
      map.on((window as any).L.Draw.Event.CREATED, async function (event: any) {
        const layer = event.layer
        const geoJSON = layer.toGeoJSON()

        console.log('Polygon created:', geoJSON)

        drawnItems.addLayer(layer)
        clientDrawnLayersRef.current.push(layer)

        if (onPolygonCreate) {
          onPolygonCreate(geoJSON.geometry)
        }
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

      // Defensive guard: before the edit toolbar opens its handles, remove any
      // layer whose latlngs are malformed. Leaflet-Draw's `Edit.Poly` calls
      // `latLngToLayerPoint(latlng)` on every vertex; a single `null` entry
      // crashes the entire edit session with "Cannot read properties of null
      // (reading 'lat')" inside `Object.project`.
      const isValidLatLngTree = (node: any): boolean => {
        if (!node) return false
        if (Array.isArray(node)) {
          if (node.length === 0) return false
          return node.every(isValidLatLngTree)
        }
        return (
          typeof node.lat === 'number' &&
          typeof node.lng === 'number' &&
          Number.isFinite(node.lat) &&
          Number.isFinite(node.lng)
        )
      }
      map.on((window as any).L.Draw.Event.EDITSTART, function () {
        try {
          const broken: any[] = []
          drawnItems.eachLayer((layer: any) => {
            const latlngs = layer?.getLatLngs?.()
            if (latlngs === undefined) return
            if (!isValidLatLngTree(latlngs)) {
              broken.push(layer)
            }
          })
          for (const layer of broken) {
            console.warn('[Leaflet] Removing polygon with invalid coordinates from edit set', layer)
            try { drawnItems.removeLayer(layer) } catch { /* ignore */ }
          }
        } catch (e) {
          console.warn('[Leaflet] EDITSTART guard failed', e)
        }
      })

      // Handle polygon edit. Decomposed MultiPolygons are emitted as multiple
      // L.Polygon layers; aggregate them back into a single MultiPolygon (or
      // Polygon if only one part) before notifying the parent so the saved
      // shape matches the original feature.
      map.on((window as any).L.Draw.Event.EDITED, function (event: any) {
        const layers = event.layers
        const editedFeatureIds = new Set<string>()
        const clientLayersEdited: any[] = []
        try {
          layers.eachLayer(function (layer: any) {
            const id = layer?.feature?.properties?.id as string | undefined
            if (id) {
              editedFeatureIds.add(id)
            } else {
              clientLayersEdited.push(layer)
            }
          })
        } catch (e) {
          console.warn('Failed to enumerate edited layers', e)
        }

        editedFeatureIds.forEach((id) => {
          const parts = polygonsByFeatureIdRef.current.get(id) ?? []
          if (!parts.length || !onPolygonEdited) return
          const polyCoords: any[] = []
          for (const part of parts) {
            try {
              const g = part.toGeoJSON()?.geometry
              if (g?.type === 'Polygon' && Array.isArray(g.coordinates) && g.coordinates.length) {
                polyCoords.push(g.coordinates)
              }
            } catch {
              /* skip broken part */
            }
          }
          if (!polyCoords.length) return
          const merged =
            polyCoords.length === 1
              ? { type: 'Polygon', coordinates: polyCoords[0] }
              : { type: 'MultiPolygon', coordinates: polyCoords }
          try {
            onPolygonEdited(id, merged)
          } catch (e) {
            console.warn('onPolygonEdited handler threw', e)
          }
        })

        for (const layer of clientLayersEdited) {
          try {
            const edited = layer.toGeoJSON()?.geometry
            if (!edited) continue
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('drawnPolygon', JSON.stringify(edited))
            }
            if (onPolygonCreate) onPolygonCreate(edited)
          } catch (e) {
            console.warn('Failed to save edited client polygon', e)
          }
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
      municipalityLayersRef.current = []
      polygonsByFeatureIdRef.current.clear()
      
      // Properly cleanup draw control before removing map
      if (drawControlRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeControl(drawControlRef.current)
          drawControlRef.current = null
        } catch (e) {
          console.warn('[Leaflet] Failed to remove draw control:', e)
        }
      }
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.warn('[Leaflet] Failed to remove map:', e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !showMapCommunities) {
      const drawnItems = drawnItemsRef.current
      const map = mapInstanceRef.current
      if (!showMapCommunities) {
        communityLayersRef.current.forEach((layer) => {
          try { drawnItems?.removeLayer?.(layer) } catch { /* ignore */ }
          try { map?.removeLayer?.(layer) } catch { /* ignore */ }
          const id = layer?.feature?.properties?.id as string | undefined
          if (id) polygonsByFeatureIdRef.current.delete(id)
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
      const drawnItems = drawnItemsRef.current
      if (!map || !drawnItems || cancelled) return

      // Clear previously rendered community polygons
      communityLayersRef.current.forEach((layer) => {
        try { drawnItems.removeLayer(layer) } catch { /* ignore */ }
        try { map.removeLayer(layer) } catch { /* ignore */ }
        const id = layer?.feature?.properties?.id as string | undefined
        if (id) polygonsByFeatureIdRef.current.delete(id)
      })
      communityLayersRef.current = []

      for (const c of mapCommunities) {
        const ringSets = geometryToPolygonRings(c?.boundary)
        if (!ringSets.length) continue

        const adjCount = c.adjacent_ids?.length ?? 0
        const popupHtml = `<div style="min-width:180px">
            <strong>${escapeHtml(c.name)}</strong><br/>
            <span style="font-size:12px;color:#666">${adjCount} adjacent communit${adjCount === 1 ? 'y' : 'ies'}</span>
            ${onMapCommunityClick ? `<br/><button class="edit-community-btn" style="margin-top:8px;color:#059669;cursor:pointer;font-size:12px;">Click to Edit</button>` : ''}
          </div>`

        const partsForFeature: any[] = []

        for (const rings of ringSets) {
          // L.polygon expects [outerLatLngs, ...holeLatLngs] in [lat, lng] order.
          const latlngs = rings.map((r) => r.map(([lng, lat]) => L.latLng(lat, lng)))
          const polygon = L.polygon(latlngs, {
            color: '#059669',
            weight: 2,
            opacity: 0.9,
            fillColor: '#10b981',
            fillOpacity: 0.15,
          })

          // Tag with feature info so EDITED can route to the right server entity.
          ;(polygon as any).feature = {
            type: 'Feature',
            geometry: c.boundary,
            properties: { id: c.id, name: c.name },
          }

          polygon.bindPopup(popupHtml)
          if (onMapCommunityClick) {
            polygon.on('popupopen', (e: any) => {
              const container = e?.popup?.getElement?.()
              if (!container) return
              const btn = container.querySelector('.edit-community-btn')
              if (!btn) return
              const handler = (ev: Event) => {
                ev.stopPropagation()
                onMapCommunityClick(c)
              }
              btn.addEventListener('click', handler)
              polygon.once('popupclose', () => {
                try { btn.removeEventListener('click', handler) } catch { /* ignore */ }
              })
            })
          }

          drawnItems.addLayer(polygon)
          communityLayersRef.current.push(polygon)
          partsForFeature.push(polygon)
        }

        if (partsForFeature.length) {
          polygonsByFeatureIdRef.current.set(String(c.id), partsForFeature)
        }
      }
    }

    drawCommunities()

    return () => {
      cancelled = true
      const map = mapInstanceRef.current
      const drawnItems = drawnItemsRef.current
      communityLayersRef.current.forEach((layer) => {
        try { drawnItems?.removeLayer?.(layer) } catch { /* ignore */ }
        try { map?.removeLayer?.(layer) } catch { /* ignore */ }
        const id = layer?.feature?.properties?.id as string | undefined
        if (id) polygonsByFeatureIdRef.current.delete(id)
      })
      communityLayersRef.current = []
    }
  }, [leafletReady, mapCommunities, showMapCommunities, onMapCommunityClick])

  // Draw municipality boundaries from API response (municipalities prop)
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current) return
    let cancelled = false
    const drawMunicipalities = async () => {
      const L = (await import('leaflet')).default
      if (cancelled) return
      const map = mapInstanceRef.current
      const drawnItems = drawnItemsRef.current
      if (!map || !drawnItems) return

      // Clear previous municipality polygons (only live inside drawnItems)
      municipalityLayersRef.current.forEach((layer) => {
        try { drawnItems.removeLayer(layer) } catch { /* ignore */ }
        try { map.removeLayer(layer) } catch { /* ignore */ }
        const id = layer?.feature?.properties?.id as string | undefined
        if (id) polygonsByFeatureIdRef.current.delete(id)
      })
      municipalityLayersRef.current = []

      // Build lookup of adjacent counts from mapCommunities (green layer) by name
      const adjByName = new Map<string, number>()
      for (const c of mapCommunities) {
        const count = c.adjacent_ids?.length ?? 0
        if (count > 0) adjByName.set(c.name.trim().toLowerCase(), count)
      }

      for (const m of municipalities || []) {
        const geom = (m as any)?.boundary
        const ringSets = geometryToPolygonRings(geom)
        if (!ringSets.length) continue

        const adjCount = m.adjacent_ids?.length ?? adjByName.get(m.name.trim().toLowerCase()) ?? 0
        const suffix = adjCount === 1 ? 'y' : 'ies'
        const popupHtml = `<div style="min-width:180px">
            <strong>${escapeHtml(m.name)}</strong><br/>
            <span style="font-size:12px;color:#666">${adjCount} adjacent communit${suffix}</span>
            ${onMapCommunityClick ? `<br /><button class="edit-community-btn" style="margin-top:8px;color:#059669;cursor:pointer;font-size:12px;">Click to Edit</button>` : ''}
          </div>`

        const partsForFeature: any[] = []

        for (const rings of ringSets) {
          const latlngs = rings.map((r) => r.map(([lng, lat]) => L.latLng(lat, lng)))
          const polygon = L.polygon(latlngs, {
            color: '#2563eb',
            weight: 2,
            opacity: 0.8,
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
          })

          ;(polygon as any).feature = {
            type: 'Feature',
            geometry: geom,
            properties: { id: m.id, name: m.name, kind: 'municipality' },
          }

          polygon.bindPopup(popupHtml)
          if (onMapCommunityClick) {
            polygon.on('popupopen', (e: any) => {
              const container = e?.popup?.getElement?.()
              if (!container) return
              const btn = container.querySelector('.edit-community-btn')
              if (!btn) return
              const handler = (ev: Event) => {
                ev.stopPropagation()
                onMapCommunityClick({ id: m.id, name: m.name, geometry: geom } as any)
              }
              btn.addEventListener('click', handler)
              polygon.once('popupclose', () => {
                try { btn.removeEventListener('click', handler) } catch { /* ignore */ }
              })
            })
          }

          drawnItems.addLayer(polygon)
          municipalityLayersRef.current.push(polygon)
          partsForFeature.push(polygon)
        }

        if (partsForFeature.length) {
          polygonsByFeatureIdRef.current.set(String(m.id), partsForFeature)
        }
      }
    }
    drawMunicipalities()
    return () => {
      cancelled = true
      const map = mapInstanceRef.current
      const drawnItems = drawnItemsRef.current
      municipalityLayersRef.current.forEach((layer) => {
        try { drawnItems?.removeLayer?.(layer) } catch { /* ignore */ }
        try { map?.removeLayer?.(layer) } catch { /* ignore */ }
        const id = layer?.feature?.properties?.id as string | undefined
        if (id) polygonsByFeatureIdRef.current.delete(id)
      })
      municipalityLayersRef.current = []
    }
  }, [leafletReady, municipalities, mapCommunities, onMapCommunityClick])

  // Focus map to a community whose name matches focusCommunityName
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !showMapCommunities) return
    const term = (focusCommunityName || '').trim().toLowerCase()
    if (!term) return
    try {
      const map = mapInstanceRef.current
      // Search through already drawn community layers
      const pools = [
        ...communityLayersRef.current,
        ...municipalityLayersRef.current,
      ]
      for (const layer of pools) {
        try {
          const name = String(layer?.feature?.properties?.name || '').toLowerCase()
          if (name && name.includes(term)) {
            const b = layer.getBounds?.()
            if (b && b.isValid && b.isValid()) {
              map.fitBounds(b.pad(0.1))
              break
            }
          }
        } catch {
          /* ignore layer errors */
        }
      }
    } catch {
      /* ignore */
    }
  }, [focusCommunityName, leafletReady, showMapCommunities])

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

            if (!map) {
              console.warn('[Leaflet] Map instance missing, skipping marker creation')
              return
            }
            
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
        try {
          const group = L.featureGroup(markersRef.current)
          const bounds = group.getBounds()
          // Re-check map before fitting bounds and ensure bounds are valid
          const mapForBounds = mapInstanceRef.current
          if (mapForBounds && bounds && bounds.isValid && bounds.isValid()) {
            mapForBounds.fitBounds(bounds.pad(0.1))
            console.log('[Leaflet] Map bounds fitted to markers')
          }
        } catch (e) {
          console.warn('[Leaflet] Failed to fit bounds:', e)
        }
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