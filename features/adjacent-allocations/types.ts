/** POST /api/compliance/adjacent-allocations/allocate/ */
export interface AllocateAdjacentPayload {
  site_census_ids: number[]
  to_community_id: string
  program: string
  reason: string
}

/** PATCH /api/compliance/adjacent-allocations/allocate/ */
export interface PatchAdjacentAllocationPayload {
  reallocation_id: string
  new_to_community_id: string
  program: string
  reason: string
}

export interface AdjacentListParams {
  program: string
  /** Census / performance year, e.g. 2050 — sent as `year` query param */
  year: number
  page?: number
  limit?: number
}

/** Raw site row from API (snake_case or camelCase) */
export interface AdjacentAllocationApiSite {
  site_census_id?: number
  id?: string | number
  name?: string
  operator_type?: string
  address?: string
}

/** Raw adjacent community from `adjacent_communities[]` */
export interface AdjacentAllocationApiAdjacent {
  id?: string
  community_id?: string
  name?: string
  community_name?: string
  shortfall?: number
  excess?: number
  required?: number
  actual?: number
  total_reallocated?: number
  reallocation_id?: string
  total_allocated_to?: number
  total_allocated_from?: number
  allocated_to?: unknown[]
  allocated_from?: unknown[]
  reallocation_cap?: Record<string, unknown>
}

/** Raw community row from GET `results[]` */
export interface AdjacentAllocationApiCommunity {
  id?: string
  community_id?: string
  name?: string
  community_name?: string
  required?: number
  actual?: number
  shortfall?: number
  excess?: number
  eligible_excess?: number
  eligibleExcess?: number
  eligible_sites?: AdjacentAllocationApiSite[]
  eligibleSites?: AdjacentAllocationApiSite[]
  adjacent_communities?: AdjacentAllocationApiAdjacent[]
  adjacent_with_shortfalls?: AdjacentAllocationApiAdjacent[]
  adjacentWithShortfalls?: AdjacentAllocationApiAdjacent[]
  adjacent_count?: number
  allocated_out?: unknown[]
  allocated_in?: unknown[]
  total_allocated_out?: number
  total_allocated_in?: number
}

export interface EligibleSiteUi {
  siteCensusId: number
  displayId: string
  name: string
  operator_type?: string
  address?: string
}

export interface AdjacentShortfallUi {
  id: string
  name: string
  shortfall: number
  excess: number
  required: number
  actual: number
  /** Sites (or units) allocated *to* this adjacent community */
  totalAllocatedTo: number
  /** Sites allocated *from* this adjacent into the source community */
  totalAllocatedFrom: number
  /** Number of allocation records toward this adjacent */
  allocatedToCount: number
  /** Number of allocation records from this adjacent */
  allocatedFromCount: number
  /** Legacy / optional explicit id for PATCH */
  reallocation_id?: string
}

export interface AllocationRecordUi {
  id: string
  siteCensusId: number
  siteName?: string
  fromCommunity?: string
  fromCommunityId?: string
  toCommunity?: string
  toCommunityId?: string
  reallocatedAt?: string
  reason?: string
}

export interface AdjacentCommunityUi {
  id: string
  name: string
  required: number
  actual: number
  shortfall: number
  excess: number
  eligibleExcess: number
  eligibleSites: EligibleSiteUi[]
  /** Count from API (`adjacent_count`) */
  adjacentCount: number
  adjacentWithShortfalls: AdjacentShortfallUi[]
  totalAllocatedOut: number
  totalAllocatedIn: number
  allocatedOutCount: number
  allocatedInCount: number
  allocatedOut: AllocationRecordUi[]
  allocatedIn: AllocationRecordUi[]
}

export interface AdjacentAllocationsSummary {
  total_communities?: number
  communities_with_shortfall?: number
  communities_with_excess?: number
  total_shortfall?: number
  total_excess?: number
}

export interface AdjacentListSelectResult {
  rows: AdjacentCommunityUi[]
  total: number
  totalPages: number
  page?: number
  pageSize?: number
  hasNext?: boolean
  hasPrev?: boolean
  summary?: AdjacentAllocationsSummary
  censusYear?: { id: number; year: number }
}
