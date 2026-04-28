export interface Event {
  id: number
  site_id: string
  site_name: string
  is_active: boolean
}

export interface EventListingCommunity {
  community: {
    id: string
    name: string
  }
  Events: Event[]
  shortfall: number
  applied_event: number
  availabel_event: number
}

export interface EventListingResponse {
  count: number
  next: string | null
  previous: string | null
  results: EventListingCommunity[]
}

export interface EventListingFilters {
  year: number
  search?: string
  sort?: string
  page?: number
  limit?: number
}

export interface ApproveEventsPayload {
  site_ids: number[]
  is_event: boolean
}
