import { useQuery } from '@tanstack/react-query'
import { fetchRegions } from './api'

const REGIONS_QUERY_KEY = ['regions']

export function useRegions() {
  try {
    return useQuery({
      queryKey: REGIONS_QUERY_KEY,
      queryFn: () => fetchRegions(),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    })
  } catch (error) {
    console.error('QueryClient not available:', error)
    // Return a mock response when QueryClient is not available
    return {
      data: [],
      isLoading: false,
      error: null,
      isError: false,
    }
  }
}
