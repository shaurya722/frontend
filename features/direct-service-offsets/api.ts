import axiosInstance from '@/lib/axios-instance'
import type {
  DirectServiceOffset,
  CreateDirectServiceOffsetPayload,
  UpdateDirectServiceOffsetPayload,
  CommunityOffset,
  CreateCommunityOffsetPayload,
  UpdateCommunityOffsetPayload,
  DirectServiceOffsetPreview,
} from './types'

const DIRECT_SERVICE_BASE = '/api/compliance/direct-service-offsets/'
const COMMUNITY_OFFSETS_BASE = '/api/compliance/community-offsets/'

export async function fetchDirectServiceOffsets(): Promise<DirectServiceOffset[]> {
  const { data } = await axiosInstance.get(DIRECT_SERVICE_BASE)
  return Array.isArray(data) ? data : (data?.results ?? [])
}

export async function createDirectServiceOffset(
  payload: CreateDirectServiceOffsetPayload,
): Promise<DirectServiceOffset> {
  const { data } = await axiosInstance.post(DIRECT_SERVICE_BASE, payload)
  return data
}

export async function updateDirectServiceOffset(
  id: number,
  payload: UpdateDirectServiceOffsetPayload,
): Promise<DirectServiceOffset> {
  const { data } = await axiosInstance.patch(`${DIRECT_SERVICE_BASE}${id}/`, payload)
  return data
}

export async function createCommunityOffset(
  payload: CreateCommunityOffsetPayload,
): Promise<CommunityOffset> {
  const { data } = await axiosInstance.post(COMMUNITY_OFFSETS_BASE, payload)
  return data
}

export async function fetchDirectServiceOffsetPreview(
  censusYearId: number,
  program: string,
  page?: number,
  limit?: number,
): Promise<DirectServiceOffsetPreview> {
  const { data } = await axiosInstance.get(`${DIRECT_SERVICE_BASE}preview/`, {
    params: {
      census_year_id: censusYearId,
      program: program,
      page,
      limit,
    },
  })
  return data
}

export async function updateCommunityOffset(
  id: number,
  payload: UpdateCommunityOffsetPayload,
): Promise<CommunityOffset> {
  const { data } = await axiosInstance.patch(`${COMMUNITY_OFFSETS_BASE}${id}/`, payload)
  return data
}
