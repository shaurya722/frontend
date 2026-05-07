import axiosInstance from '@/lib/axios-instance'
import type {
  AdjacentListParams,
  AllocateAdjacentPayload,
  PatchAdjacentAllocationPayload,
} from './types'

const BASE = '/api/compliance/adjacent-allocations/'
const ALLOCATE = `${BASE}allocate/`

export async function fetchAdjacentAllocations(
  params: AdjacentListParams,
): Promise<unknown> {
  const { data } = await axiosInstance.get(BASE, {
    params: {
      program: params.program,
      year: params.year,
      sort: params.sort,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
    },
  })
  return data
}

export async function allocateAdjacent(
  payload: AllocateAdjacentPayload,
): Promise<unknown> {
  const { data } = await axiosInstance.post(ALLOCATE, payload)
  return data
}

export async function patchAdjacentAllocation(
  payload: PatchAdjacentAllocationPayload,
): Promise<unknown> {
  const { data } = await axiosInstance.patch(ALLOCATE, payload)
  return data
}

export async function fetchAdjacentAllocationById(
  reallocationId: string,
): Promise<unknown> {
  const { data } = await axiosInstance.get(`${BASE}${reallocationId}/`)
  return data
}
