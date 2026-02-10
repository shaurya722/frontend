import type { Reallocation, CollectionSite, Municipality } from "./supabase"
import * as api from "./api"

/**
 * Convert API reallocation to frontend Reallocation format
 */
function apiReallocationToReallocation(apiRealloc: api.ApiReallocation): Reallocation {
  return {
    id: apiRealloc.id,
    site_id: apiRealloc.site,
    site: apiRealloc.site_detail ? {
      id: apiRealloc.site_detail.id,
      name: apiRealloc.site_detail.name,
      address: apiRealloc.site_detail.address,
      municipality_id: apiRealloc.site_detail.municipality,
      site_type: apiRealloc.site_detail.site_type,
      programs: apiRealloc.site_detail.programs,
      status: apiRealloc.site_detail.status,
      created_at: apiRealloc.site_detail.created_at,
      updated_at: apiRealloc.site_detail.updated_at,
    } : undefined,
    from_municipality_id: apiRealloc.from_municipality,
    from_municipality: apiRealloc.from_municipality_detail ? {
      id: apiRealloc.from_municipality_detail.id,
      name: apiRealloc.from_municipality_detail.name,
      population: apiRealloc.from_municipality_detail.population,
      tier: apiRealloc.from_municipality_detail.tier,
      region: apiRealloc.from_municipality_detail.region,
      province: apiRealloc.from_municipality_detail.province,
      created_at: apiRealloc.from_municipality_detail.created_at,
      updated_at: apiRealloc.from_municipality_detail.updated_at,
    } : undefined,
    to_municipality_id: apiRealloc.to_municipality,
    to_municipality: apiRealloc.to_municipality_detail ? {
      id: apiRealloc.to_municipality_detail.id,
      name: apiRealloc.to_municipality_detail.name,
      population: apiRealloc.to_municipality_detail.population,
      tier: apiRealloc.to_municipality_detail.tier,
      region: apiRealloc.to_municipality_detail.region,
      province: apiRealloc.to_municipality_detail.province,
      created_at: apiRealloc.to_municipality_detail.created_at,
      updated_at: apiRealloc.to_municipality_detail.updated_at,
    } : undefined,
    program: apiRealloc.program,
    reallocation_type: apiRealloc.reallocation_type,
    percentage: apiRealloc.percentage,
    rationale: apiRealloc.rationale,
    status: apiRealloc.status,
    validation_errors: apiRealloc.validation_errors,
    created_at: apiRealloc.created_at,
    updated_at: apiRealloc.updated_at,
    created_by: apiRealloc.created_by,
    approved_by: apiRealloc.approved_by,
    approved_at: apiRealloc.approved_at,
  }
}

/**
 * Get all reallocations
 * 
 * Backend API: GET /api/v1/reallocations/
 * Postman: Reallocations > List All Reallocations
 */
export async function getReallocations(): Promise<Reallocation[]> {
  try {
    console.log("[reallocations] Fetching reallocations from API...")

    const response = await api.getReallocations()
    if (response.data) {
      const reallocations = response.data.results.map(apiReallocationToReallocation)
      console.log("[reallocations] Successfully fetched reallocations:", reallocations.length)
      return reallocations
    }
    
    if (response.error) {
      console.error("[reallocations] API error:", response.error)
    }
    
    return []
  } catch (error) {
    console.error("[reallocations] Exception fetching reallocations:", error)
    return []
  }
}

/**
 * Create a new reallocation
 * 
 * Backend API: POST /api/v1/reallocations/
 * Postman: Reallocations > Create Reallocation
 */
export async function createReallocation(
  reallocation: Omit<Reallocation, "id" | "created_at" | "updated_at">,
): Promise<Reallocation> {
  console.log("[reallocations] Creating new reallocation")

  const response = await api.createReallocation({
    site: reallocation.site_id,
    from_municipality: reallocation.from_municipality_id,
    to_municipality: reallocation.to_municipality_id,
    program: reallocation.program,
    reallocation_type: reallocation.reallocation_type,
    percentage: reallocation.percentage,
    rationale: reallocation.rationale,
  })
  
  if (response.data) {
    console.log("[reallocations] Reallocation created successfully:", response.data.id)
    return apiReallocationToReallocation(response.data)
  }
  
  throw new Error(response.error || "Failed to create reallocation")
}

/**
 * Update reallocation status (approve/reject)
 * 
 * Backend API: 
 *   - POST /api/v1/reallocations/{id}/approve/
 *   - POST /api/v1/reallocations/{id}/reject/
 * Postman: 
 *   - Reallocations > Approve Reallocation
 *   - Reallocations > Reject Reallocation
 */
export async function updateReallocationStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  approvedBy?: string,
  rationale?: string,
): Promise<Reallocation> {
  console.log("[reallocations] Updating reallocation status:", id, status)

  let response
  if (status === "approved") {
    response = await api.approveReallocation(id)
  } else if (status === "rejected") {
    response = await api.rejectReallocation(id, rationale)
  } else {
    throw new Error("Invalid status for API update")
  }
  
  if (response.data) {
    console.log("[reallocations] Reallocation status updated successfully")
    return apiReallocationToReallocation(response.data)
  }
  
  throw new Error(response.error || "Failed to update reallocation status")
}

/**
 * Delete a reallocation
 * 
 * Backend API: DELETE /api/v1/reallocations/{id}/
 * Postman: Reallocations > Delete Reallocation
 */
export async function deleteReallocation(id: string): Promise<void> {
  console.log("[reallocations] Deleting reallocation:", id)

  const response = await api.deleteReallocation(id)
  if (response.error) {
    throw new Error(response.error)
  }
  
  console.log("[reallocations] Reallocation deleted successfully")
}

/**
 * Get reallocation statistics
 * 
 * Backend API: GET /api/v1/reallocations/stats/
 * Postman: Reallocations > Get Reallocation Stats
 */
export async function getReallocationStats(): Promise<any> {
  try {
    const response = await api.getReallocationStats()
    if (response.data) {
      return response.data
    }
    
    // Fallback: calculate from reallocations
    const reallocations = await getReallocations()
    return {
      total: reallocations.length,
      pending: reallocations.filter(r => r.status === "pending").length,
      approved: reallocations.filter(r => r.status === "approved").length,
      rejected: reallocations.filter(r => r.status === "rejected").length,
    }
  } catch (error) {
    console.error("[reallocations] Error fetching reallocation stats:", error)
    return null
  }
}

// Validation functions

/**
 * Validate a reallocation request
 * Checks adjacency rules and percentage limits
 */
export function validateReallocation(
  reallocation: Partial<Reallocation>,
  site: CollectionSite,
  municipalities: Municipality[],
): string[] {
  const errors: string[] = []

  if (!reallocation.to_municipality_id) {
    errors.push("Destination municipality is required")
    return errors
  }

  const fromMunicipality = municipalities.find((m) => m.id === site.municipality_id)
  const toMunicipality = municipalities.find((m) => m.id === reallocation.to_municipality_id)
  const program = reallocation.program || ""

  if (!fromMunicipality || !toMunicipality) {
    errors.push("Invalid municipality selection")
    return errors
  }

  // Mock adjacency check (in production, this would use GIS data or API)
  const adjacencyMap: { [key: string]: string[] } = {
    Toronto: ["Mississauga", "Vaughan", "Markham"],
    Mississauga: ["Toronto", "Brampton"],
    Hamilton: ["Toronto"],
    Ottawa: ["Gatineau"],
    London: ["Kitchener"],
    Kitchener: ["London", "Vaughan"],
    Windsor: ["London"],
    Vaughan: ["Toronto", "Markham"],
    Markham: ["Toronto", "Vaughan"],
    Brampton: ["Mississauga", "Vaughan"],
  }

  const adjacentMunicipalities = adjacencyMap[fromMunicipality.name] || []

  if (program === "Lighting") {
    // EEE: adjacent only
    if (!adjacentMunicipalities.includes(toMunicipality.name)) {
      errors.push("EEE (Lighting) sites can only be reallocated to adjacent municipalities")
    }
  } else if (["Paint", "Solvents", "Pesticides"].includes(program)) {
    // HSP: adjacent or same upper-tier
    const isAdjacent = adjacentMunicipalities.includes(toMunicipality.name)
    const isSameUpperTier = fromMunicipality.region === toMunicipality.region

    if (!isAdjacent && !isSameUpperTier) {
      errors.push("HSP sites can only be reallocated to adjacent municipalities or within the same upper-tier")
    }
  }

  // Check percentage limits
  if (reallocation.reallocation_type === "event" && (reallocation.percentage || 0) > 35) {
    errors.push("Events can offset maximum 35% of required sites")
  }

  if (reallocation.reallocation_type === "site" && (reallocation.percentage || 0) > 10) {
    errors.push("Adjacent community sharing limited to 10% of required sites")
  }

  return errors
}

// ============================================================================
// TOOL A - DIRECT SERVICE OFFSET
// ============================================================================

/**
 * Get Tool A offset calculations
 * 
 * Backend API: GET /api/v1/tools/tool-a/
 * Postman: Tool A - Direct Service Offset > Get Offset Calculations
 */
export async function getToolAOffsets(filters?: {
  program?: string
  year?: number
  global_percentage?: number
}): Promise<any> {
  try {
    const response = await api.getToolAOffsets(filters)
    if (response.data) {
      return response.data
    }
    return null
  } catch (error) {
    console.error("[reallocations] Error fetching Tool A offsets:", error)
    return null
  }
}

/**
 * Apply Tool A global offset
 * 
 * Backend API: POST /api/v1/tools/tool-a/
 * Postman: Tool A - Direct Service Offset > Apply Global Offset
 */
export async function applyToolAOffset(data: {
  program: string
  year: number
  global_percentage: number
}): Promise<any> {
  const response = await api.applyToolAOffset(data)
  if (response.data) {
    return response.data
  }
  throw new Error(response.error || "Failed to apply Tool A offset")
}

// ============================================================================
// TOOL B - EVENT APPLICATION
// ============================================================================

/**
 * Get Tool B shortfalls and events data
 * 
 * Backend API: GET /api/v1/tools/tool-b/
 * Postman: Tool B - Event Application > Get Shortfalls and Events
 */
export async function getToolBData(filters?: {
  program?: string
  year?: number
}): Promise<any> {
  try {
    const response = await api.getToolBData(filters)
    if (response.data) {
      return response.data
    }
    return null
  } catch (error) {
    console.error("[reallocations] Error fetching Tool B data:", error)
    return null
  }
}

/**
 * Apply events to community
 * 
 * Backend API: POST /api/v1/tools/tool-b/
 * Postman: Tool B - Event Application > Apply Events to Community
 */
export async function applyEventsToCommunit(data: {
  community_id: string
  event_ids: string[]
  program: string
  year: number
}): Promise<any> {
  const response = await api.applyEventsToCommunit(data)
  if (response.data) {
    return response.data
  }
  throw new Error(response.error || "Failed to apply events")
}

// ============================================================================
// TOOL C - ADJACENT REALLOCATION
// ============================================================================

/**
 * Get Tool C excess communities data
 * 
 * Backend API: GET /api/v1/tools/tool-c/
 * Postman: Tool C - Adjacent Reallocation > Get Excess Communities
 */
export async function getToolCData(filters?: {
  program?: string
}): Promise<any> {
  try {
    const response = await api.getToolCData(filters)
    if (response.data) {
      return response.data
    }
    return null
  } catch (error) {
    console.error("[reallocations] Error fetching Tool C data:", error)
    return null
  }
}

/**
 * Create Tool C reallocation request
 * 
 * Backend API: POST /api/v1/tools/tool-c/
 * Postman: Tool C - Adjacent Reallocation > Create Reallocation Request
 */
export async function createToolCReallocation(data: {
  site_ids: string[]
  from_community_id: string
  to_community_id: string
  program: string
  rationale?: string
}): Promise<any> {
  const response = await api.createToolCReallocation(data)
  if (response.data) {
    return response.data
  }
  throw new Error(response.error || "Failed to create Tool C reallocation")
}
