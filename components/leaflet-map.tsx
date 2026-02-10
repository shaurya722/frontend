"use client"

import { useEffect, useRef } from "react"
import type { CollectionSite, Municipality } from "@/lib/supabase"

interface LeafletMapProps {
  sites: CollectionSite[]
  municipalities: Municipality[]
  onSiteClick?: (site: CollectionSite) => void
  onMunicipalityClick?: (municipality: Municipality) => void
  filters?: {
    status: string
    program: string
    municipality: string
    siteType: string
  }
  layers?: {
    id: string
    name: string
    visible: boolean
    color: string
  }[]
}

export default function LeafletMap({ sites, municipalities, onSiteClick, filters, layers }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Dynamically import Leaflet to avoid SSR issues
    const initMap = async () => {
      const L = (await import("leaflet")).default
      
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Fix for default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (!mapRef.current || mapInstanceRef.current) return

      console.log("[Leaflet] Initializing map...")
      
      // Initialize map centered on Ontario
      const map = L.map(mapRef.current, {
        // Ensure map doesn't interfere with dialogs
        zoomControl: true,
      }).setView([44.5, -79.5], 6)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Ensure Leaflet controls don't interfere with dialogs
      // Leaflet uses z-index up to 1000, so we need dialogs higher
      if (mapRef.current) {
        const mapContainer = mapRef.current
        // Set a lower z-index for the map container to ensure dialogs appear above
        mapContainer.style.zIndex = '1'
        mapContainer.style.position = 'relative'
      }

      console.log("[Leaflet] Map initialized successfully")
      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined") return

    const updateMarkers = async () => {
      const L = (await import("leaflet")).default

      console.log("[Leaflet] Updating markers, total sites:", sites.length)

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Sites are already filtered in map-view.tsx, so we use them directly
      // But we can apply additional filtering here if needed for map-specific logic
      const filteredSites = sites

      console.log("[Leaflet] Filtered sites:", filteredSites.length)

      // Check if sites layer is visible
      const sitesLayerVisible = layers?.find(l => l.id === "sites")?.visible !== false

      // Add markers for filtered sites (only if sites layer is visible)
      if (sitesLayerVisible) {
        filteredSites.forEach((site) => {
          const lat = Number(site.latitude)
          const lng = Number(site.longitude)
          if (!isNaN(lat) && !isNaN(lng) && site.latitude != null && site.longitude != null) {
            // Create custom icon based on operator type (matching the legend)
            const getOperatorTypeColor = (operatorType?: string) => {
              switch (operatorType) {
                case "Retailer":
                  return "#3b82f6" // blue-500
                case "Distributor":
                  return "#a855f7" // purple-500
                case "Municipal":
                  return "#14b8a6" // teal-500
                case "First Nation/Indigenous":
                  return "#f59e0b" // amber-500
                case "Private Depot":
                  return "#10b981" // green-500
                case "Product Care":
                  return "#06b6d4" // cyan-500
                case "Regional District":
                  return "#6366f1" // indigo-500
                case "Regional Service Commission":
                  return "#ec4899" // pink-500
                case "Other":
                  return "#6b7280" // gray-500
                default:
                  return "#9ca3af" // gray-400
              }
            }

            const color = getOperatorTypeColor(site.operator_type)
          
          const customIcon = L.divIcon({
            className: "custom-marker",
            html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = L.marker([lat, lng], { icon: customIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(
              `
              <div style="min-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 8px;">${site.name}</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${site.address || "No address"}</p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>Type:</strong> ${site.site_type || "Unknown"}</p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>Status:</strong> <span style="color: ${site.status === "Active" ? "green" : "red"};">${site.status || "Unknown"}</span></p>
                <p style="font-size: 12px; margin-bottom: 4px;"><strong>Programs:</strong> ${Array.isArray(site.programs) ? site.programs.join(", ") : "None"}</p>
                <p style="font-size: 12px;"><strong>Population Served:</strong> ${(site.population_served || 0).toLocaleString()}</p>
              </div>
            `,
            )

          if (onSiteClick) {
            marker.on("click", () => onSiteClick(site))
          }

          markersRef.current.push(marker)
        }
      })
      }

      console.log("[Leaflet] Added markers:", markersRef.current.length)

      // Fit map to show all markers if there are any
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current)
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
        console.log("[Leaflet] Map bounds fitted to markers")
      }
    }

    updateMarkers()
  }, [sites, municipalities, filters, layers, onSiteClick])

  return <div ref={mapRef} className="h-[600px] w-full rounded-lg" />
}
