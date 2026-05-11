// Axios instance with interceptors

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { extractApiErrorMessage } from './api-response-messages'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.3.154:8000'

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available, but skip for login requests
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('access_token')
      // Don't add token to login or token refresh endpoints
      const skipAuthEndpoints = [
        '/accounts/login/',
        '/accounts/token/refresh/',
        '/api/auth/token/',
        '/api/auth/token/refresh/',
      ]
      const shouldSkipAuth = skipAuthEndpoints.some(endpoint => config.url?.includes(endpoint))
      
      if (accessToken && config.headers && !shouldSkipAuth) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
      })
    }

    return config
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      })
    }

    return response
  },
  (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data = error.response.data

      // Check if the response is JSON or HTML/text
      let parsedData: any = data
      let errorMessage = 'An error occurred'

      try {
        // If data is already parsed, use it
        if (typeof data === 'object' && data !== null) {
          parsedData = data
        } else if (typeof data === 'string') {
          // Try to parse as JSON
          parsedData = JSON.parse(data)
        }

        errorMessage = extractApiErrorMessage(parsedData, {
          httpStatus: status,
          fallback: `HTTP ${status} error`,
        })
      } catch (parseError) {
        // If JSON parsing fails, it's likely an HTML error page
        console.error('❌ JSON Parse Error - likely HTML error page:', typeof data === 'string' ? data.substring(0, 200) : data)
        errorMessage = `Server error (${status}): ${error.message || 'Unable to parse response'}`
        parsedData = { message: errorMessage, status }
      }

      console.error('❌ Response Error:', {
        status,
        url: error.config?.url,
        message: errorMessage,
        errors: parsedData?.errors,
      })

      // Handle 401 Unauthorized — token expired or invalid, redirect to login
      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }

      // Handle other specific status codes
      switch (status) {
        case 403:
          console.error('Access forbidden')
          break
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Server error - check backend logs')
          break
        default:
          console.error('API Error:', errorMessage)
      }

      // Return formatted error
      return Promise.reject({
        message: errorMessage,
        status,
        errors: parsedData?.errors,
        data: parsedData,
      })
    } else if (error.request) {
      // Request made but no response received
      console.error('❌ Network Error:', error.message)
      return Promise.reject({
        message: 'Network error - please check your connection',
        status: 0,
      })
    } else {
      // Something else happened
      console.error('❌ Error:', error.message)
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      })
    }
  }
)

export default axiosInstance

// Auth helpers
export async function login(username: string, password: string) {
  // Use raw axios to avoid interceptor Authorization injection
  const res = await axiosInstance.post('/api/auth/token/', { username, password })
  if (typeof window !== 'undefined') {
    // Support multiple possible payload shapes
    const data: any = res.data || {}
    const access = data.access || data.access_token || data.token || data.accessToken
    const refresh = data.refresh || data.refresh_token
    if (access) localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
  }
  return res.data
}

export async function getProfile() {
  const res = await axiosInstance.get('/api/auth/profile/')
  return res.data
}
