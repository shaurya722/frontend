// API Client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.3.154:8000'

export interface ApiResponse<T> {
  status: number
  message: string
  results: number
  data: T
}

export interface PaginatedResponse<T> {
  docs: T[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  nextPage: number | null
  page: number
  prevPage: number | null
  totalDocs: number
  totalPages: number
}

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

import axiosInstance from './axios-instance'

export async function apiGet<T>(url: string, params?: any): Promise<T> {
  const res = await axiosInstance.get<T>(url, { params })
  return res.data as unknown as T
}

export async function apiPost<T>(url: string, data?: any): Promise<T> {
  const res = await axiosInstance.post<T>(url, data)
  return res.data as unknown as T
}

export async function apiPut<T>(url: string, data?: any): Promise<T> {
  const res = await axiosInstance.put<T>(url, data)
  return res.data as unknown as T
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await axiosInstance.delete<T>(url)
  return res.data as unknown as T
}

export async function apiRequest<T>(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  url: string,
  options: { data?: any; params?: any } = {},
): Promise<T> {
  const res = await axiosInstance.request<T>({ method, url, ...options })
  return res.data as unknown as T
}
