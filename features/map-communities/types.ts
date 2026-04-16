export interface MapCommunityBoundary {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

export interface MapCommunity {
  id: string
  name: string
  boundary: MapCommunityBoundary
  adjacent_ids: string[]
  created_at?: string
  updated_at?: string
}

export interface AvailableMapCommunity {
  id: string
  name: string
  has_boundary: boolean
}

export interface AvailableMapCommunitiesResponse {
  communities: AvailableMapCommunity[]
  total: number
  returned: number
}

/** POST — link drawn boundary to a census/community row by id */
export interface CreateMapCommunityPayload {
  community_id: string
  boundary: MapCommunityBoundary
}

/** PATCH — send any subset of fields the backend accepts */
export interface UpdateMapCommunityPayload {
  community_id?: string
  name?: string
  boundary?: MapCommunityBoundary
}
