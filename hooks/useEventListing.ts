import { useQuery } from '@tanstack/react-query'

interface ApiResponse {
  community: {
    id: string
    name: string
  }
  Events: {
    id: number
    site_id: string
    site_name: string
    is_active: boolean
  }[]
  shortfall: number
  applied_event: number
  availabel_event: number
}

export const useEventListing = (year: number, search?: string, page?: number, limit?: number) => {
  const params = new URLSearchParams({ year: year.toString() })
  if (search) params.set('search', search)
  if (page) params.set('page', page.toString())
  if (limit) params.set('limit', limit.toString())

  return useQuery<{ results: ApiResponse[] }>({
    queryKey: ['eventListing', year, search, page, limit],
    queryFn: async () => {
      const response = await fetch(`http://127.0.0.1:8000/api/sites/event-listing/?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch event listing')
      }
      return response.json()
    },
  })
}
