import axiosInstance from '@/lib/axios-instance'
import { ApproveEventsPayload, EventListingFilters, EventListingResponse } from './types'

export const fetchEventListing = async (
  filters: EventListingFilters,
): Promise<EventListingResponse> => {
  const params = new URLSearchParams()

  params.append('year', filters.year.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.page !== undefined) params.append('page', filters.page.toString())
  if (filters.limit !== undefined) params.append('limit', filters.limit.toString())

  const response = await axiosInstance.get(`/api/sites/event-listing/?${params.toString()}`)
  return response.data
}

export const approveEvents = async (payload: ApproveEventsPayload) => {
  const response = await axiosInstance.put('/api/sites/approve-events/', payload)
  return response.data
}
