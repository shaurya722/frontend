// React Query hooks for Census Years Management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getCensusYears, 
  createCensusYear, 
  updateCensusYear, 
  deleteCensusYear,
  type CensusYearsResponse,
  type CreateCensusYearData,
  type UpdateCensusYearData,
  type CensusYear,
  type GetCensusYearsParams
} from '@/features/census-year/census-years'
import { useToast } from '@/hooks/use-toast'

/**
 * Hook to fetch paginated census years
 */
export function useCensusYearsList(params: GetCensusYearsParams = { page: 1, limit: 10 }) {
  return useQuery<CensusYearsResponse>({
    queryKey: ['censusYears', params],
    queryFn: () => getCensusYears(params),
  })
}

/**
 * Hook to create a new census year
 */
export function useCreateCensusYear() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateCensusYearData) => createCensusYear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['censusYears'] })
      toast({
        title: 'Success',
        description: 'Census year created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create census year',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to update a census year
 */
export function useUpdateCensusYear() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCensusYearData }) => 
      updateCensusYear(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['censusYears'] })
      toast({
        title: 'Success',
        description: 'Census year updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update census year',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook to delete a census year
 */
export function useDeleteCensusYear() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: number) => deleteCensusYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['censusYears'] })
      toast({
        title: 'Success',
        description: 'Census year deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete census year',
        variant: 'destructive',
      })
    },
  })
}
