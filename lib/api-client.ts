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
