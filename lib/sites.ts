  import type { CollectionSite, Municipality, AdjacentCommunity } from "./supabase"
import * as api from "./api"

// Pagination response type
export interface PaginatedSitesResponse {
  sites: CollectionSite[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * Convert API site to frontend CollectionSite format
 */
function apiSiteToCollectionSite(apiSite: api.ApiCollectionSite): CollectionSite {
  return {
    id: apiSite.id,
    name: apiSite.name,
    address: apiSite.address,
    municipality_id: apiSite.municipality,
    municipality: apiSite.municipality_detail ? {
      id: apiSite.municipality_detail.id,
      name: apiSite.municipality_detail.name,
      population: apiSite.municipality_detail.population,
      tier: apiSite.municipality_detail.tier,
      region: apiSite.municipality_detail.region,
      province: apiSite.municipality_detail.province,
      census_year: apiSite.municipality_detail.census_year,
      created_at: apiSite.municipality_detail.created_at,
      updated_at: apiSite.municipality_detail.updated_at,
    } : undefined,
    site_type: apiSite.site_type,
    site_id_number: apiSite.site_id_number,
    operator_type: apiSite.operator_type,
    service_partner: apiSite.service_partner,
    materials_collected: apiSite.materials_collected,
    collection_scope: apiSite.collection_scope,
    community: apiSite.community,
    region_district: apiSite.region_district,
    service_area: apiSite.service_area,
    programs: apiSite.programs,
    population_served: apiSite.population_served,
    status: apiSite.status,
    // Ensure latitude and longitude are numbers (convert from string if needed)
    latitude: apiSite.latitude != null ? Number(apiSite.latitude) : undefined,
    longitude: apiSite.longitude != null ? Number(apiSite.longitude) : undefined,
    active_dates: apiSite.active_dates,
    notes: apiSite.notes,
    created_at: apiSite.created_at,
    updated_at: apiSite.updated_at,
    created_by: apiSite.created_by,
  }
}

/**
 * Convert API municipality to frontend Municipality format
 */
function apiMunicipalityToMunicipality(apiMunicipality: api.ApiMunicipality): Municipality {
  return {
    id: apiMunicipality.id,
    name: apiMunicipality.name,
    population: apiMunicipality.population,
    tier: apiMunicipality.tier,
    region: apiMunicipality.region,
    province: apiMunicipality.province,
    census_year: apiMunicipality.census_year,
    created_at: apiMunicipality.created_at,
    updated_at: apiMunicipality.updated_at,
  }
}

/**
 * Get all collection sites (non-paginated, for backward compatibility)
 * 
 * Backend API: GET /api/v1/sites/?page_size=1000
 * Postman: Collection Sites > List All Sites
 */
export async function getSites(): Promise<CollectionSite[]> {
  try {
    console.log("[sites] Fetching all collection sites from API...")

    // Fetch with large page size to get all sites
    const response = await api.getSites({ page_size: 1000 })
    if (response.data) {
      const sites = response.data.results.map(apiSiteToCollectionSite)
      console.log("[sites] Successfully fetched sites:", sites.length)
      return sites
    }
    
    if (response.error) {
      console.error("[sites] API error:", response.error)
    }
    
    return []
  } catch (error) {
    console.error("[sites] Exception fetching sites:", error)
    return []
  }
}

/**
 * Get paginated collection sites
 * 
 * Backend API: GET /api/v1/sites/?page=X&page_size=Y
 * Postman: Collection Sites > List All Sites
 */
export async function getSitesPaginated(
  page: number = 1, 
  pageSize: number = 10,
  filters?: api.SiteFilters
): Promise<PaginatedSitesResponse> {
  try {
    console.log(`[sites] Fetching paginated sites: page=${page}, pageSize=${pageSize}`)

    const response = await api.getSites({
      ...filters,
      page,
      page_size: pageSize,
    })
    
    if (response.data) {
      const sites = response.data.results.map(apiSiteToCollectionSite)
      const total = response.data.count
      const totalPages = Math.ceil(total / pageSize)
      
      console.log(`[sites] Successfully fetched page ${page}/${totalPages}, ${sites.length} sites`)
      
      return {
        sites,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: response.data.next !== null,
        hasPrevious: response.data.previous !== null,
      }
    }
    
    if (response.error) {
      console.error("[sites] API error:", response.error)
    }
    
    return {
      sites: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    }
  } catch (error) {
    console.error("[sites] Exception fetching paginated sites:", error)
    return {
      sites: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    }
  }
}

/**
 * Create a new collection site
 * 
 * Backend API: POST /api/v1/sites/
 * Postman: Collection Sites > Create Site
 */
export async function createSite(
  site: Omit<CollectionSite, "id" | "created_at" | "updated_at">,
): Promise<CollectionSite> {
  console.log("[sites] Creating new site:", site.name)

  const response = await api.createSite({
    name: site.name,
    address: site.address,
    municipality: site.municipality_id,
    site_type: site.site_type,
    operator_type: site.operator_type,
    service_partner: site.service_partner,
    materials_collected: site.materials_collected,
    collection_scope: site.collection_scope,
    community: site.community,
    region_district: site.region_district,
    service_area: site.service_area,
    programs: site.programs,
    population_served: site.population_served,
    status: site.status,
    latitude: site.latitude,
    longitude: site.longitude,
    active_dates: site.active_dates,
    notes: site.notes,
  })
  
  if (response.data) {
    console.log("[sites] Site created successfully:", response.data.id)
    return apiSiteToCollectionSite(response.data)
  }
  
  throw new Error(response.error || "Failed to create site")
}

/**
 * Update a collection site
 * 
 * Backend API: PUT /api/v1/sites/{id}/
 * Postman: Collection Sites > Update Site
 */
export async function updateSite(id: string, updates: Partial<CollectionSite>): Promise<CollectionSite> {
  console.log("[sites] Updating site:", id)

  const response = await api.updateSite(id, {
    name: updates.name,
    address: updates.address,
    municipality: updates.municipality_id,
    site_type: updates.site_type,
    operator_type: updates.operator_type,
    service_partner: updates.service_partner,
    materials_collected: updates.materials_collected,
    collection_scope: updates.collection_scope,
    community: updates.community,
    region_district: updates.region_district,
    service_area: updates.service_area,
    programs: updates.programs,
    population_served: updates.population_served,
    status: updates.status,
    latitude: updates.latitude,
    longitude: updates.longitude,
    active_dates: updates.active_dates,
    notes: updates.notes,
  })
  
  if (response.data) {
    console.log("[sites] Site updated successfully")
    return apiSiteToCollectionSite(response.data)
  }
  
  throw new Error(response.error || "Failed to update site")
}

/**
 * Delete a collection site
 * 
 * Backend API: DELETE /api/v1/sites/{id}/
 * Postman: Collection Sites > Delete Site
 */
export async function deleteSite(id: string): Promise<void> {
  console.log("[sites] Deleting site:", id)

  const response = await api.deleteSite(id)
  if (response.error) {
    throw new Error(response.error)
  }
  
  console.log("[sites] Site deleted successfully")
}

/**
 * Get sites for map display
 * 
 * Backend API: GET /api/v1/sites/map/
 * Postman: Collection Sites > Get Sites for Map
 */
export async function getSitesForMap(): Promise<CollectionSite[]> {
  try {
    const response = await api.getSitesForMap()
    if (response.data) {
      return response.data.map(apiSiteToCollectionSite)
    }
    
    // Fallback to regular getSites
    return getSites()
  } catch (error) {
    console.error("[sites] Error fetching sites for map:", error)
    return []
  }
}

/**
 * Get site statistics
 * 
 * Backend API: GET /api/v1/sites/stats/
 * Postman: Collection Sites > Get Site Stats
 */
export async function getSiteStats(): Promise<any> {
  try {
    const response = await api.getSiteStats()
    if (response.data) {
      return response.data
    }
    
    // Fallback: calculate from sites
    const sites = await getSites()
    return {
      total: sites.length,
      active: sites.filter(s => s.status === "Active").length,
      inactive: sites.filter(s => s.status === "Inactive" || s.status === "Deactivated").length,
      scheduled: sites.filter(s => s.status === "Scheduled").length,
    }
  } catch (error) {
    console.error("[sites] Error fetching site stats:", error)
    return null
  }
}

/**
 * Deduplicates municipalities by name (case-insensitive)
 * Keeps only the first occurrence of each unique community name
 */
export function deduplicateMunicipalities(municipalities: Municipality[]): Municipality[] {
  const uniqueMap = new Map<string, Municipality>()
  
  for (const municipality of municipalities) {
    const key = municipality.name.toLowerCase().trim()
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, municipality)
    }
  }
  
  return Array.from(uniqueMap.values())
}

/**
 * Get all municipalities
 * 
 * Backend API: GET /api/v1/municipalities/
 * Postman: Municipalities > List All Municipalities
 */
export async function getMunicipalities(filters?: api.MunicipalityFilters): Promise<api.PaginatedResponse<api.ApiMunicipality>> {
  try {
    console.log("[sites] Fetching municipalities from API...")

    const response = await api.getMunicipalities(filters)
    if (response.data) {
      console.log("[sites] Successfully fetched municipalities:", response.data.count)
      return response.data
    }
    
    if (response.error) {
      console.error("[sites] API error:", response.error)
    }
    
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    }
  } catch (error) {
    console.error("[sites] Exception fetching municipalities:", error)
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    }
  }
}

/**
 * Get municipality statistics
 * 
 * Backend API: GET /api/v1/municipalities/stats/
 * Postman: Municipalities > Get Municipality Stats
 */
export async function getMunicipalityStats(): Promise<any> {
  try {
    const response = await api.getMunicipalityStats()
    if (response.data) {
      return response.data
    }
    
    // Fallback: calculate from municipalities
    const municipalitiesData = await getMunicipalities({ page_size: 1000 })
    const municipalities = municipalitiesData.results
    return {
      total: municipalitiesData.count,
      byTier: {
        Single: municipalities.filter((m: any) => m.tier === "Single").length,
        Lower: municipalities.filter((m: any) => m.tier === "Lower").length,
        Upper: municipalities.filter((m: any) => m.tier === "Upper").length,
      },
    }
  } catch (error) {
    console.error("[sites] Error fetching municipality stats:", error)
    return null
  }
}

/**
 * Get adjacent communities for a municipality
 * 
 * Backend API: GET /api/v1/municipalities/{id}/adjacent/
 * Postman: Municipalities > Get Adjacent Communities
 */
export async function getAdjacentCommunities(id?: string): Promise<Municipality[] | AdjacentCommunity[]> {
  try {
    if (id) {
      // Get adjacent communities for a specific municipality
      const response = await api.getAdjacentCommunities(id)
      if (response.data) {
        return response.data.map(apiMunicipalityToMunicipality)
      }
      return []
    } else {
      // Get all adjacent community relationships
      const response = await api.getAllAdjacentCommunities()
      if (response.data) {
        return response.data.map((rel) => ({
          id: rel.id,
          community_id: rel.community,
          adjacent_community_id: rel.adjacent_community,
          created_at: rel.created_at,
        }))
      }
      return []
    }
  } catch (error) {
    console.error("[sites] Error fetching adjacent communities:", error)
    return []
  }
}

// AdjacentCommunity type is imported from lib/supabase.ts
