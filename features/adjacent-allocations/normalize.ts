import type {
  AdjacentAllocationApiAdjacent,
  AdjacentAllocationApiCommunity,
  AdjacentAllocationApiSite,
  AdjacentAllocationsSummary,
  AdjacentCommunityUi,
  AdjacentListSelectResult,
  AdjacentShortfallUi,
  AllocationRecordUi,
  EligibleSiteUi,
} from './types'

function firstReallocationId(
  allocatedTo: unknown[],
  allocatedFrom: unknown[],
): string | undefined {
  for (const arr of [allocatedTo, allocatedFrom]) {
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        const id = o.reallocation_id ?? o.reallocationId
        if (typeof id === 'string' && id.length > 0) return id
      }
    }
  }
  return undefined
}

function mapSite(s: AdjacentAllocationApiSite): EligibleSiteUi | null {
  const census =
    s.site_census_id ??
    (typeof s.id === 'number' ? s.id : parseInt(String(s.id), 10))
  if (!Number.isFinite(census) || census <= 0) return null
  return {
    siteCensusId: census,
    displayId: String(s.id ?? census),
    name: s.name ?? '—',
    operator_type: s.operator_type,
    address: s.address ?? '',
  }
}

function mapAdjacent(a: AdjacentAllocationApiAdjacent): AdjacentShortfallUi {
  const allocatedTo = Array.isArray(a.allocated_to) ? a.allocated_to : []
  const allocatedFrom = Array.isArray(a.allocated_from) ? a.allocated_from : []
  const id = String(a.id ?? a.community_id ?? '')
  return {
    id,
    name: String(a.name ?? a.community_name ?? '—'),
    shortfall: Number(a.shortfall ?? 0),
    excess: Number(a.excess ?? 0),
    required: Number(a.required ?? 0),
    actual: Number(a.actual ?? 0),
    totalAllocatedTo: Number(a.total_allocated_to ?? 0),
    totalAllocatedFrom: Number(a.total_allocated_from ?? 0),
    allocatedToCount: allocatedTo.length,
    allocatedFromCount: allocatedFrom.length,
    reallocation_id:
      typeof a.reallocation_id === 'string' && a.reallocation_id
        ? a.reallocation_id
        : firstReallocationId(allocatedTo, allocatedFrom),
  }
}

export function normalizeCommunityRow(
  raw: AdjacentAllocationApiCommunity,
): AdjacentCommunityUi | null {
  const id = String(raw.community_id ?? raw.id ?? '')
  if (!id) return null
  const name = String(raw.community_name ?? raw.name ?? '—')
  const rawSites = raw.eligible_sites ?? raw.eligibleSites ?? []
  const eligibleSites = rawSites
    .map(mapSite)
    .filter((x): x is EligibleSiteUi => x != null)
  const rawAdj =
    raw.adjacent_communities ??
    raw.adjacent_with_shortfalls ??
    raw.adjacentWithShortfalls ??
    []
  const adjacentWithShortfalls = rawAdj.map(mapAdjacent)
  const adjacentCount = Number(
    raw.adjacent_count ?? rawAdj.length ?? adjacentWithShortfalls.length,
  )
  const rawAllocatedOut = Array.isArray(raw.allocated_out) ? raw.allocated_out : []
  const rawAllocatedIn = Array.isArray(raw.allocated_in) ? raw.allocated_in : []

  const mapAllocation = (item: unknown): AllocationRecordUi | null => {
    if (!item || typeof item !== 'object') return null
    const a = item as Record<string, unknown>
    const id = String(a.id ?? a.reallocation_id ?? a.reallocationId ?? '')
    if (!id) return null
    const siteCensusId = Number(a.site_census_id ?? a.siteCensusId ?? 0)
    if (!Number.isFinite(siteCensusId) || siteCensusId <= 0) return null
    return {
      id,
      siteCensusId,
      siteName: String(a.site_name ?? a.siteName ?? ''),
      fromCommunity: String(a.from_community ?? a.fromCommunity ?? ''),
      fromCommunityId: String(a.from_community_id ?? a.fromCommunityId ?? ''),
      toCommunity: String(a.to_community ?? a.toCommunity ?? ''),
      toCommunityId: String(a.to_community_id ?? a.toCommunityId ?? ''),
      reallocatedAt: String(a.reallocated_at ?? a.reallocatedAt ?? ''),
      reason: String(a.reason ?? ''),
    }
  }

  const allocatedOut = rawAllocatedOut.map(mapAllocation).filter((x): x is AllocationRecordUi => x != null)
  const allocatedIn = rawAllocatedIn.map(mapAllocation).filter((x): x is AllocationRecordUi => x != null)

  return {
    id,
    name,
    required: Number(raw.required ?? 0),
    actual: Number(raw.actual ?? 0),
    shortfall: Number(raw.shortfall ?? 0),
    excess: Number(raw.excess ?? 0),
    eligibleExcess: Number(raw.eligible_excess ?? raw.eligibleExcess ?? 0),
    eligibleSites,
    adjacentCount: Number.isFinite(adjacentCount) ? adjacentCount : 0,
    adjacentWithShortfalls,
    totalAllocatedOut: Number(raw.total_allocated_out ?? 0),
    totalAllocatedIn: Number(raw.total_allocated_in ?? 0),
    allocatedOutCount: allocatedOut.length,
    allocatedInCount: allocatedIn.length,
    allocatedOut,
    allocatedIn,
  }
}

export function rowsFromListPayload(
  data: unknown,
  fallbackPageSize = 20,
): AdjacentListSelectResult {
  if (data == null) {
    return { rows: [], total: 0, totalPages: 1 }
  }
  const d = data as Record<string, unknown>

  if (Array.isArray(data)) {
    const rows = data
      .map((r) => normalizeCommunityRow(r as AdjacentAllocationApiCommunity))
      .filter((x): x is AdjacentCommunityUi => x != null)
    return { rows, total: rows.length, totalPages: 1 }
  }

  const list =
    (Array.isArray(d.results) ? d.results : null) ??
    (Array.isArray(d.communities) ? d.communities : null) ??
    (Array.isArray(d.data) ? d.data : null)

  if (!list) {
    return { rows: [], total: 0, totalPages: 1 }
  }

  const rows = list
    .map((r) => normalizeCommunityRow(r as AdjacentAllocationApiCommunity))
    .filter((x): x is AdjacentCommunityUi => x != null)

  const totalDocs = Number(d.totalDocs ?? d.count ?? d.total ?? rows.length)
  const total = Number.isFinite(totalDocs) ? totalDocs : rows.length
  const apiTotalPages = Number(d.totalPages)
  const pageSize = Number(d.page_size ?? fallbackPageSize)
  const computedPages = Math.max(1, Math.ceil(total / (pageSize || fallbackPageSize)))
  const totalPages =
    Number.isFinite(apiTotalPages) && apiTotalPages > 0
      ? apiTotalPages
      : computedPages

  const summary = d.summary as AdjacentAllocationsSummary | undefined
  const censusYear = d.census_year as { id: number; year: number } | undefined

  return {
    rows,
    total,
    totalPages,
    summary,
    censusYear,
  }
}
