import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchEventListing, approveEvents } from './api'
import type { ApproveEventsPayload, EventListingFilters, EventListingResponse } from './types'

export const EVENT_LISTING_QUERY_KEY = 'event-listing'

export const useEventListing = (filters: EventListingFilters) => {
  const normalizedFilters = useMemo(() => filters, [filters])

  return useQuery<EventListingResponse>({
    queryKey: [EVENT_LISTING_QUERY_KEY, normalizedFilters],
    queryFn: () => fetchEventListing(filters),
    enabled: !!filters?.year,
    staleTime: 60000,
  })
}

export const useApproveEvents = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ApproveEventsPayload) => approveEvents(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENT_LISTING_QUERY_KEY] })
    },
  })
}
