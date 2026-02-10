/**
 * API Client for Django Backend
 * 
 * This module provides a centralized API client that connects the frontend
 * to the Django backend REST API. It handles authentication, request/response
 * formatting, and error handling.
 * 
 * Base URL: Configured via NEXT_PUBLIC_API_URL environment variable
 * Default: http://localhost:8000
 */

// Types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthTokens {
  access: string
  refresh: string
  user: ApiUser
}

export interface ApiUser {
  id: string
  username: string
  email: string
  name: string
  role: "Administrator" | "Compliance Analyst" | "Viewer"
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface ApiMunicipality {
  id: string
  name: string
  population: number
  tier: "Single" | "Lower" | "Upper"
  region: string
  province: string
  census_year?: number
  created_at: string
  updated_at: string
}

export interface ApiCollectionSite {
  id: string
  name: string
  address: string
  municipality: string // UUID
  municipality_detail?: ApiMunicipality
  site_type: string
  site_id_number?: number
  operator_type?: string
  service_partner?: string
  materials_collected?: string[]
  collection_scope?: string[]
  community?: string
  region_district?: string
  service_area?: number
  programs: string[]
  population_served?: number
  status: "Active" | "Inactive" | "Scheduled" | "Pending" | "Deactivated"
  latitude?: number
  longitude?: number
  active_dates?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface ApiReallocation {
  id: string
  site: string // UUID
  site_detail?: ApiCollectionSite
  from_municipality: string // UUID
  from_municipality_detail?: ApiMunicipality
  to_municipality: string // UUID
  to_municipality_detail?: ApiMunicipality
  program: string
  reallocation_type: "site" | "event" | "direct_return"
  percentage: number
  rationale?: string
  status: "pending" | "approved" | "rejected"
  validation_errors?: string[]
  created_at: string
  updated_at: string
  created_by?: string
  approved_by?: string
  approved_at?: string
}

export interface ApiComplianceCalculation {
  id: string
  municipality: string
  municipality_detail?: ApiMunicipality
  program: string
  required_sites: number
  actual_sites: number
  shortfall: number
  excess: number
  compliance_rate: number
  offset_percentage?: number
  calculation_date: string
  created_by?: string
}

export interface ApiRegulatoryRule {
  id: string
  name: string
  description: string
  program: string
  category: string
  rule_type: string
  parameters: Record<string, any>
  status: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface ApiDirectServiceOffset {
  id: string
  program: string
  year: number
  global_percentage: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface ApiCommunityOffset {
  id: string
  community: string
  community_detail?: ApiMunicipality
  program: string
  year: number
  percentage_override?: number
  new_required?: number
  created_at: string
  updated_at: string
}

export interface ApiEventApplication {
  id: string
  community: string
  community_detail?: ApiMunicipality
  event_site: string
  event_site_detail?: ApiCollectionSite
  program: string
  year: number
  applied_at: string
  applied_by?: string
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://arcgisn-ov2025-gb6c.vercel.app"
const API_VERSION = "v1"

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * Store authentication tokens
 */
export function setTokens(access: string, refresh: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

/**
 * Clear authentication tokens
 */
export function clearTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/**
 * Build API URL
 */
function buildUrl(endpoint: string, queryParams?: Record<string, string | number | boolean | undefined>): string {
  let url = `${API_BASE_URL}/api/${API_VERSION}${endpoint}`
  
  if (queryParams) {
    const params = new URLSearchParams()
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value))
      }
    })
    const queryString = params.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }
  
  return url
}

/**
 * Make authenticated API request
 * 
 * This function automatically includes Bearer token in the Authorization header
 * for all requests (except login/refresh endpoints).
 * 
 * @param endpoint - API endpoint path (e.g., "/sites/")
 * @param options - Fetch options (method, body, etc.)
 * @param queryParams - Query parameters to append to URL
 * @param requireAuth - Whether authentication is required (default: true)
 *                      Set to false for public endpoints like login/refresh
 * 
 * @returns Promise resolving to ApiResponse<T>
 * 
 * Features:
 * - Automatically includes "Authorization: Bearer <token>" header
 * - Handles token refresh on 401 errors
 * - Retries request with new token after refresh
 * - Clears tokens and returns error if refresh fails
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, string | number | boolean | undefined>,
  requireAuth: boolean = true,
  skipJson: boolean = false
): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint, queryParams)
  const accessToken = getAccessToken()
  
  // If auth is required but no token, return error
  if (requireAuth && !accessToken) {
    return {
      data: null,
      error: "Authentication required. Please login.",
      status: 401,
    }
  }
  
  const headers: HeadersInit = {
    ...(skipJson ? {} : { "Content-Type": "application/json" }),
    // Bypass ngrok warning page
    "ngrok-skip-browser-warning": "true",
    ...options.headers,
  }
  
  // Always include Authorization header with Bearer token if token exists
  // This ensures all authenticated requests include the token
  if (accessToken) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })
    
    // Handle 401 - try to refresh token
    if (response.status === 401 && accessToken) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retry with new token
        ;(headers as Record<string, string>)["Authorization"] = `Bearer ${getAccessToken()}`
        const retryResponse = await fetch(url, { ...options, headers })
        
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}))
          return {
            data: null,
            error: errorData.detail || errorData.message || `Request failed with status ${retryResponse.status}`,
            status: retryResponse.status,
          }
        }
        
        const data = await retryResponse.json()
        return { data, error: null, status: retryResponse.status }
      } else {
        // Refresh failed, clear tokens
        clearTokens()
        return { data: null, error: "Session expired. Please login again.", status: 401 }
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        data: null,
        error: errorData.detail || errorData.message || `Request failed with status ${response.status}`,
        status: response.status,
      }
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return { data: null, error: null, status: 204 }
    }
    
    const data = await response.json()
    return { data, error: null, status: response.status }
  } catch (error) {
    console.error("API request error:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error",
      status: 0,
    }
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  
  try {
    const response = await fetch(buildUrl("/auth/refresh/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Bypass ngrok warning page
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })
    
    if (!response.ok) return false
    
    const data = await response.json()
    if (data.access) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
      return true
    }
    return false
  } catch {
    return false
  }
}

// ============================================================================
// AUTHENTICATION API
// Postman Collection: Authentication folder
// ============================================================================

/**
 * Login with username and password
 * Endpoint: POST /api/v1/auth/login/
 * Note: Login endpoint does not require authentication
 */
export async function login(credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> {
  const response = await apiRequest<AuthTokens>(
    "/auth/login/",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    undefined,
    false // Login does not require auth
  )
  
  if (response.data) {
    setTokens(response.data.access, response.data.refresh)
  }
  
  return response
}

/**
 * Logout - clear tokens
 */
export function logout(): void {
  clearTokens()
  if (typeof window !== "undefined") {
    localStorage.removeItem("user")
  }
}

/**
 * Refresh access token
 * Endpoint: POST /api/v1/auth/refresh/
 * Note: Refresh endpoint does not require Bearer token (uses refresh token in body)
 */
export async function refreshToken(): Promise<ApiResponse<{ access: string }>> {
  const refresh = getRefreshToken()
  if (!refresh) {
    return { data: null, error: "No refresh token", status: 401 }
  }
  
  return apiRequest<{ access: string }>(
    "/auth/refresh/",
    {
      method: "POST",
      body: JSON.stringify({ refresh }),
    },
    undefined,
    false // Refresh does not require Bearer token
  )
}

// ============================================================================
// USERS API
// Postman Collection: Users folder
// ============================================================================

/**
 * List all users
 * Endpoint: GET /api/v1/auth/users/
 */
export async function getUsers(): Promise<ApiResponse<PaginatedResponse<ApiUser>>> {
  return apiRequest<PaginatedResponse<ApiUser>>("/auth/users/")
}

/**
 * Get current user profile
 * Endpoint: GET /api/v1/auth/users/me/
 */
export async function getCurrentUser(): Promise<ApiResponse<ApiUser>> {
  return apiRequest<ApiUser>("/auth/users/me/")
}

/**
 * Get user by ID
 * Endpoint: GET /api/v1/auth/users/{id}/
 */
export async function getUserById(id: string): Promise<ApiResponse<ApiUser>> {
  return apiRequest<ApiUser>(`/auth/users/${id}/`)
}

/**
 * Create new user
 * Endpoint: POST /api/v1/auth/users/
 */
export async function createUser(userData: Partial<ApiUser> & { password: string }): Promise<ApiResponse<ApiUser>> {
  return apiRequest<ApiUser>("/auth/users/", {
    method: "POST",
    body: JSON.stringify(userData),
  })
}

/**
 * Update user
 * Endpoint: PUT /api/v1/auth/users/{id}/
 */
export async function updateUser(id: string, userData: Partial<ApiUser>): Promise<ApiResponse<ApiUser>> {
  return apiRequest<ApiUser>(`/auth/users/${id}/`, {
    method: "PUT",
    body: JSON.stringify(userData),
  })
}

/**
 * Update current user profile
 * Endpoint: PUT /api/v1/auth/users/update_profile/
 */
export async function updateProfile(userData: Partial<ApiUser>): Promise<ApiResponse<ApiUser>> {
  return apiRequest<ApiUser>("/auth/users/update_profile/", {
    method: "PUT",
    body: JSON.stringify(userData),
  })
}

/**
 * Change password
 * Endpoint: POST /api/v1/auth/users/change_password/
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>("/auth/users/change_password/", {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

/**
 * Delete user
 * Endpoint: DELETE /api/v1/auth/users/{id}/
 */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/auth/users/${id}/`, { method: "DELETE" })
}

// ============================================================================
// MUNICIPALITIES API
// Postman Collection: Municipalities folder
// ============================================================================

export interface MunicipalityFilters {
  tier?: string
  region?: string
  search?: string
  page?: number
  page_size?: number
  ordering?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * List all municipalities
 * Endpoint: GET /api/v1/municipalities/
 */
export async function getMunicipalities(filters?: MunicipalityFilters): Promise<ApiResponse<PaginatedResponse<ApiMunicipality>>> {
  return apiRequest<PaginatedResponse<ApiMunicipality>>("/municipalities/", {}, filters)
}

/**
 * Get municipality by ID
 * Endpoint: GET /api/v1/municipalities/{id}/
 */
export async function getMunicipalityById(id: string): Promise<ApiResponse<ApiMunicipality>> {
  return apiRequest<ApiMunicipality>(`/municipalities/${id}/`)
}

/**
 * Create municipality
 * Endpoint: POST /api/v1/municipalities/
 */
export async function createMunicipality(data: Partial<ApiMunicipality>): Promise<ApiResponse<ApiMunicipality>> {
  return apiRequest<ApiMunicipality>("/municipalities/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Update municipality
 * Endpoint: PUT /api/v1/municipalities/{id}/
 */
export async function updateMunicipality(id: string, data: Partial<ApiMunicipality>): Promise<ApiResponse<ApiMunicipality>> {
  return apiRequest<ApiMunicipality>(`/municipalities/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Delete municipality
 * Endpoint: DELETE /api/v1/municipalities/{id}/
 */
export async function deleteMunicipality(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/municipalities/${id}/`, { method: "DELETE" })
}

/**
 * Get municipality statistics
 * Endpoint: GET /api/v1/municipalities/stats/
 */
export async function getMunicipalityStats(): Promise<ApiResponse<any>> {
  return apiRequest<any>("/municipalities/stats/")
}

/**
 * Bulk import municipalities from CSV
 * Endpoint: POST /api/v1/municipalities/bulk_import/
 */
export async function bulkImportMunicipalities(file: File): Promise<ApiResponse<any>> {
  const formData = new FormData()
  formData.append('file', file)
  
  return apiRequest<any>("/municipalities/bulk_import/", {
    method: "POST",
    body: formData,
  }, undefined, true, true) // requireAuth=true, skipJson=true for FormData
}

/**
 * Get all adjacent community relationships
 * Endpoint: GET /api/v1/municipalities/adjacent/
 */
export interface AdjacentCommunityRelation {
  id: string
  community: string
  community_name: string
  adjacent_community: string
  adjacent_community_name: string
  created_at: string
}

export async function getAllAdjacentCommunities(): Promise<ApiResponse<AdjacentCommunityRelation[]>> {
  return apiRequest<AdjacentCommunityRelation[]>(`/municipalities/adjacent/`)
}

/**
 * Get adjacent communities for a specific municipality
 * Endpoint: GET /api/v1/municipalities/{id}/adjacent/
 */
export async function getAdjacentCommunities(id: string): Promise<ApiResponse<ApiMunicipality[]>> {
  return apiRequest<ApiMunicipality[]>(`/municipalities/${id}/adjacent/`)
}

/**
 * Get census history
 * Endpoint: GET /api/v1/municipalities/{id}/census_history/
 */
export async function getCensusHistory(id: string): Promise<ApiResponse<any[]>> {
  return apiRequest<any[]>(`/municipalities/${id}/census_history/`)
}

// ============================================================================
// COLLECTION SITES API
// Postman Collection: Collection Sites folder
// ============================================================================

export interface SiteFilters {
  // Pagination
  page?: number
  page_size?: number
  
  // Filters
  status?: string
  site_type?: string
  operator_type?: string
  municipality?: string
  programs?: string[]
  service_partner?: string
  
  // Search
  search?: string
  
  // Ordering (e.g., "name", "-created_at", "status")
  ordering?: string
}

/**
 * List all sites
 * Endpoint: GET /api/v1/sites/
 */
export async function getSites(filters?: SiteFilters): Promise<ApiResponse<PaginatedResponse<ApiCollectionSite>>> {
  return apiRequest<PaginatedResponse<ApiCollectionSite>>("/sites/", {}, filters as Record<string, any>)
}

/**
 * Get site by ID
 * Endpoint: GET /api/v1/sites/{id}/
 */
export async function getSiteById(id: string): Promise<ApiResponse<ApiCollectionSite>> {
  return apiRequest<ApiCollectionSite>(`/sites/${id}/`)
}

/**
 * Create site
 * Endpoint: POST /api/v1/sites/
 */
export async function createSite(data: Partial<ApiCollectionSite>): Promise<ApiResponse<ApiCollectionSite>> {
  return apiRequest<ApiCollectionSite>("/sites/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Update site (partial update with PATCH)
 * Endpoint: PATCH /api/v1/sites/{id}/
 */
export async function updateSite(id: string, data: Partial<ApiCollectionSite>): Promise<ApiResponse<ApiCollectionSite>> {
  return apiRequest<ApiCollectionSite>(`/sites/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

/**
 * Delete site
 * Endpoint: DELETE /api/v1/sites/{id}/
 */
export async function deleteSite(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/sites/${id}/`, { method: "DELETE" })
}

/**
 * Get site statistics
 * Endpoint: GET /api/v1/sites/statistics/
 */
export async function getSiteStatistics(filters?: SiteFilters): Promise<ApiResponse<{
  total: number
  active: number
  scheduled: number
  inactive: number
  filtered: number
}>> {
  return apiRequest<{
    total: number
    active: number
    scheduled: number
    inactive: number
    filtered: number
  }>("/sites/statistics/", {}, filters as Record<string, any>)
}

/**
 * Bulk import sites from CSV
 * Endpoint: POST /api/v1/sites/import_csv/
 */
export async function bulkImportSites(file: File): Promise<ApiResponse<{
  created: number
  errors: string[]
}>> {
  const formData = new FormData()
  formData.append("file", file)
  
  return apiRequest<{
    created: number
    errors: string[]
  }>("/sites/import_csv/", {
    method: "POST",
    body: formData,
  }, undefined, true, true) // requireAuth=true, skipJson=true for FormData
}

/**
 * Export sites to CSV
 * Endpoint: GET /api/v1/sites/export/
 */
export async function exportSitesToCSV(filters?: SiteFilters): Promise<Blob> {
  const queryParams = new URLSearchParams()
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, String(v)))
        } else {
          queryParams.append(key, String(value))
        }
      }
    })
  }
  
  const queryString = queryParams.toString()
  const url = `${API_BASE_URL}/api/${API_VERSION}/sites/export/${queryString ? `?${queryString}` : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'ngrok-skip-browser-warning': 'true',
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to export sites')
  }
  
  return response.blob()
}

/**
 * Get sites for map display
 * Endpoint: GET /api/v1/sites/map/
 */
export async function getSitesForMap(): Promise<ApiResponse<ApiCollectionSite[]>> {
  return apiRequest<ApiCollectionSite[]>("/sites/map/")
}

/**
 * Get site statistics
 * Endpoint: GET /api/v1/sites/stats/
 */
export async function getSiteStats(): Promise<ApiResponse<any>> {
  return apiRequest<any>("/sites/stats/")
}

/**
 * Get sites by program
 * Endpoint: GET /api/v1/sites/by_program/
 */
export async function getSitesByProgram(): Promise<ApiResponse<any>> {
  return apiRequest<any>("/sites/by_program/")
}

/**
 * Export sites to CSV
 * Endpoint: GET /api/v1/sites/export/
 */
/**
 * Export sites to CSV
 * Endpoint: GET /api/v1/sites/export/
 */
export async function exportSites(): Promise<Blob | null> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    console.error("[exportSites] No access token available")
    return null
  }
  
  try {
    const response = await fetch(buildUrl("/sites/export/"), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Bypass ngrok warning page
        "ngrok-skip-browser-warning": "true",
      },
    })
    if (!response.ok) {
      console.error("[exportSites] Export failed:", response.status)
      return null
    }
    return response.blob()
  } catch (error) {
    console.error("[exportSites] Export error:", error)
    return null
  }
}

// ============================================================================
// COMPLIANCE API
// Postman Collection: Compliance folder
// ============================================================================

export interface ComplianceFilters {
  program?: string
  municipality?: string
  offset_percentage?: number
  [key: string]: string | number | boolean | undefined
}

/**
 * Analyze compliance
 * Endpoint: GET /api/v1/compliance/analyze/
 */
export async function analyzeCompliance(filters?: ComplianceFilters): Promise<ApiResponse<any>> {
  return apiRequest<any>("/compliance/analyze/", {}, filters)
}

/**
 * Save compliance calculation
 * Endpoint: POST /api/v1/compliance/analyze/
 */
export async function saveComplianceCalculation(data: {
  municipality: string
  program: string
  offset_percentage?: number
}): Promise<ApiResponse<ApiComplianceCalculation>> {
  return apiRequest<ApiComplianceCalculation>("/compliance/analyze/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Calculate requirements for population
 * Endpoint: POST /api/v1/compliance/calculate/
 */
export async function calculateRequirements(data: {
  population: number
  program: string
  offset_percentage?: number
}): Promise<ApiResponse<{ required: number; adjusted_required: number }>> {
  return apiRequest<{ required: number; adjusted_required: number }>("/compliance/calculate/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * List compliance calculations
 * Endpoint: GET /api/v1/compliance/calculations/
 */
export async function getComplianceCalculations(): Promise<ApiResponse<PaginatedResponse<ApiComplianceCalculation>>> {
  return apiRequest<PaginatedResponse<ApiComplianceCalculation>>("/compliance/calculations/")
}

/**
 * List regulatory rules
 * Endpoint: GET /api/v1/compliance/rules/
 */
export async function getRegulatoryRules(filters?: {
  program?: string
  category?: string
}): Promise<ApiResponse<PaginatedResponse<ApiRegulatoryRule>>> {
  return apiRequest<PaginatedResponse<ApiRegulatoryRule>>("/compliance/rules/", {}, filters)
}

/**
 * Create regulatory rule
 * Endpoint: POST /api/v1/compliance/rules/
 */
export async function createRegulatoryRule(data: Partial<ApiRegulatoryRule>): Promise<ApiResponse<ApiRegulatoryRule>> {
  return apiRequest<ApiRegulatoryRule>("/compliance/rules/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Update regulatory rule
 * Endpoint: PUT /api/v1/compliance/rules/{id}/
 */
export async function updateRegulatoryRule(id: string, data: Partial<ApiRegulatoryRule>): Promise<ApiResponse<ApiRegulatoryRule>> {
  return apiRequest<ApiRegulatoryRule>(`/compliance/rules/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

/**
 * Delete regulatory rule
 * Endpoint: DELETE /api/v1/compliance/rules/{id}/
 */
export async function deleteRegulatoryRule(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/compliance/rules/${id}/`, { method: "DELETE" })
}

// ============================================================================
// REALLOCATIONS API
// Postman Collection: Reallocations folder
// ============================================================================

export interface ReallocationFilters {
  status?: string
  program?: string
  reallocation_type?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * List all reallocations
 * Endpoint: GET /api/v1/reallocations/
 */
export async function getReallocations(filters?: ReallocationFilters): Promise<ApiResponse<PaginatedResponse<ApiReallocation>>> {
  return apiRequest<PaginatedResponse<ApiReallocation>>("/reallocations/", {}, filters)
}

/**
 * Get reallocation by ID
 * Endpoint: GET /api/v1/reallocations/{id}/
 */
export async function getReallocationById(id: string): Promise<ApiResponse<ApiReallocation>> {
  return apiRequest<ApiReallocation>(`/reallocations/${id}/`)
}

/**
 * Create reallocation
 * Endpoint: POST /api/v1/reallocations/
 */
export async function createReallocation(data: Partial<ApiReallocation>): Promise<ApiResponse<ApiReallocation>> {
  return apiRequest<ApiReallocation>("/reallocations/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Approve reallocation
 * Endpoint: POST /api/v1/reallocations/{id}/approve/
 */
export async function approveReallocation(id: string): Promise<ApiResponse<ApiReallocation>> {
  return apiRequest<ApiReallocation>(`/reallocations/${id}/approve/`, { method: "POST" })
}

/**
 * Reject reallocation
 * Endpoint: POST /api/v1/reallocations/{id}/reject/
 */
export async function rejectReallocation(id: string, rationale?: string): Promise<ApiResponse<ApiReallocation>> {
  return apiRequest<ApiReallocation>(`/reallocations/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({ rationale }),
  })
}

/**
 * Get reallocation statistics
 * Endpoint: GET /api/v1/reallocations/stats/
 */
export async function getReallocationStats(): Promise<ApiResponse<any>> {
  return apiRequest<any>("/reallocations/stats/")
}

/**
 * Delete reallocation
 * Endpoint: DELETE /api/v1/reallocations/{id}/
 */
export async function deleteReallocation(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`/reallocations/${id}/`, { method: "DELETE" })
}

// ============================================================================
// TOOL A - DIRECT SERVICE OFFSET API
// Postman Collection: Tool A - Direct Service Offset folder
// ============================================================================

/**
 * Get offset calculations
 * Endpoint: GET /api/v1/tools/tool-a/
 */
export async function getToolAOffsets(filters?: {
  program?: string
  year?: number
  global_percentage?: number
}): Promise<ApiResponse<any>> {
  return apiRequest<any>("/tools/tool-a/", {}, filters)
}

/**
 * Apply global offset
 * Endpoint: POST /api/v1/tools/tool-a/
 */
export async function applyToolAOffset(data: {
  program: string
  year: number
  global_percentage: number
}): Promise<ApiResponse<any>> {
  return apiRequest<any>("/tools/tool-a/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * List global offsets
 * Endpoint: GET /api/v1/tools/offsets/global/
 */
export async function getGlobalOffsets(): Promise<ApiResponse<PaginatedResponse<ApiDirectServiceOffset>>> {
  return apiRequest<PaginatedResponse<ApiDirectServiceOffset>>("/tools/offsets/global/")
}

/**
 * Create global offset
 * Endpoint: POST /api/v1/tools/offsets/global/
 */
export async function createGlobalOffset(data: Partial<ApiDirectServiceOffset>): Promise<ApiResponse<ApiDirectServiceOffset>> {
  return apiRequest<ApiDirectServiceOffset>("/tools/offsets/global/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * List community offsets
 * Endpoint: GET /api/v1/tools/offsets/community/
 */
export async function getCommunityOffsets(): Promise<ApiResponse<PaginatedResponse<ApiCommunityOffset>>> {
  return apiRequest<PaginatedResponse<ApiCommunityOffset>>("/tools/offsets/community/")
}

/**
 * Create community offset override
 * Endpoint: POST /api/v1/tools/offsets/community/
 */
export async function createCommunityOffset(data: Partial<ApiCommunityOffset>): Promise<ApiResponse<ApiCommunityOffset>> {
  return apiRequest<ApiCommunityOffset>("/tools/offsets/community/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================================================
// TOOL B - EVENT APPLICATION API
// Postman Collection: Tool B - Event Application folder
// ============================================================================

/**
 * Get shortfalls and events
 * Endpoint: GET /api/v1/tools/tool-b/
 */
export async function getToolBData(filters?: {
  program?: string
  year?: number
}): Promise<ApiResponse<any>> {
  return apiRequest<any>("/tools/tool-b/", {}, filters)
}

/**
 * Apply events to community
 * Endpoint: POST /api/v1/tools/tool-b/
 */
export async function applyEventsToCommunit(data: {
  community_id: string
  event_ids: string[]
  program: string
  year: number
}): Promise<ApiResponse<any>> {
  return apiRequest<any>("/tools/tool-b/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Apply all events automatically
 * Endpoint: POST /api/v1/tools/tool-b/apply-all/
 */
export async function applyAllEvents(data: {
  program: string
  year: number
}): Promise<ApiResponse<any>> {
  return apiRequest<any>("/tools/tool-b/apply-all/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * List event applications
 * Endpoint: GET /api/v1/tools/events/applications/
 */
export async function getEventApplications(filters?: {
  program?: string
  year?: number
}): Promise<ApiResponse<PaginatedResponse<ApiEventApplication>>> {
  return apiRequest<PaginatedResponse<ApiEventApplication>>("/tools/events/applications/", {}, filters)
}

// ============================================================================
// TOOL C - ADJACENT REALLOCATION API
// Postman Collection: Tool C - Adjacent Reallocation folder
// ============================================================================

/**
 * Get excess communities
 * Endpoint: GET /api/v1/tools/tool-c/
 */
export async function getToolCData(filters?: {
  program?: string
}): Promise<ApiResponse<any>> {
  return apiRequest<any>("/tools/tool-c/", {}, filters)
}

/**
 * Create reallocation request
 * Endpoint: POST /api/v1/tools/tool-c/
 */
export async function createToolCReallocation(data: {
  site_ids: string[]
  from_community_id: string
  to_community_id: string
  program: string
  rationale?: string
}): Promise<ApiResponse<any>> {
  return apiRequest<any>("/tools/tool-c/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================================================
// COMPLIANCE ANALYSIS API
// ============================================================================

export interface ComplianceAnalysisFilters {
  [key: string]: string | number | boolean | undefined
  program?: string
  municipality?: string
  offset_percentage?: number
  search?: string
  ordering?: string
  page?: number
  page_size?: number
  status?: string
}

export interface ComplianceResult {
  municipality_id: string
  municipality_name: string
  program: string
  required: number
  actual: number
  incoming: number
  outgoing: number
  adjusted: number
  shortfall: number
  excess: number
  compliance_rate: number
  status: "compliant" | "shortfall" | "excess"
  municipal_depots: number
  return_to_retail: number
  events: number
}

export interface ComplianceSummary {
  total: number
  compliant: number
  shortfalls: number
  excesses: number
  total_shortfall_sites: number
  total_excess_sites: number
  total_required: number
  total_actual: number
  overall_compliance_rate: number
}

export interface CompliancePagination {
  page: number
  page_size: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface ComplianceAnalysisResponse {
  results: ComplianceResult[]
  summary: ComplianceSummary
  pagination: CompliancePagination
}

/**
 * Get compliance analysis data with pagination, search, and sorting
 * Endpoint: GET /api/v1/compliance/analyze/
 */
export async function getComplianceAnalysis(
  filters?: ComplianceAnalysisFilters
): Promise<ApiResponse<ComplianceAnalysisResponse>> {
  return apiRequest<ComplianceAnalysisResponse>("/compliance/analyze/", {}, filters)
}

// ============================================================================
// ADJACENT REALLOCATION API (New GetAll endpoint)
// ============================================================================

export interface AdjacentReallocationFilters {
  [key: string]: string | number | boolean | undefined
  program?: string
  page?: number
  limit?: number
  search?: string
  ordering?: string
}

export interface AdjacentReallocationResponse {
  program: string
  communities: any[]
  results: any[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  nextPage: number | null
  page: number
  prevPage: number | null
  totalDocs: number
  totalPages: number
  summary: {
    communities_with_excess: number
    total_eligible_excess: number
    total_adjacent_shortfalls: number
  }
}

/**
 * Get all communities with eligible excess, adjacent shortfalls, and reallocation details
 * Endpoint: GET /api/v1/reallocations/adjacent/
 */
export async function getAdjacentReallocations(
  filters?: AdjacentReallocationFilters
): Promise<ApiResponse<AdjacentReallocationResponse>> {
  return apiRequest<AdjacentReallocationResponse>("/reallocations/adjacent/", {}, filters)
}

/**
 * Create a single reallocation
 * Endpoint: POST /api/v1/reallocations/
 */
export async function createReallocationRequest(data: {
  site: string
  from_municipality: string
  to_municipality: string
  program: string
  reallocation_type: string
  percentage: number
  rationale?: string
}): Promise<ApiResponse<any>> {
  return apiRequest<any>("/reallocations/", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

/**
 * Get current user from storage
 */
export function getStoredUser(): ApiUser | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem("user")
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * Store user in localStorage
 */
export function storeUser(user: ApiUser): void {
  if (typeof window === "undefined") return
  localStorage.setItem("user", JSON.stringify(user))
}

// ============================================================================
// NAMESPACE EXPORTS FOR CONVENIENT ACCESS
// ============================================================================

/**
 * Users API namespace
 */
export const users = {
  list: async () => {
    const response = await getUsers()
    return response.data?.results || []
  },
  get: getUserById,
  create: async (data: Partial<ApiUser> & { password?: string }) => {
    const response = await createUser(data as Partial<ApiUser> & { password: string })
    if (response.error) throw new Error(response.error)
    return response.data!
  },
  update: async (id: string, data: Partial<ApiUser>) => {
    const response = await updateUser(id, data)
    if (response.error) throw new Error(response.error)
    return response.data!
  },
  delete: async (id: string) => {
    const response = await deleteUser(id)
    if (response.error) throw new Error(response.error)
  },
  me: getCurrentUser,
  updateProfile: updateProfile,
  changePassword: changePassword,
}

/**
 * Municipalities API namespace
 */
export const municipalities = {
  list: async (filters?: MunicipalityFilters) => {
    const response = await getMunicipalities(filters)
    return response.data?.results || []
  },
  get: getMunicipalityById,
  create: async (data: Partial<ApiMunicipality>) => {
    const response = await createMunicipality(data)
    if (response.error) throw new Error(response.error)
    return response.data!
  },
  update: async (id: string, data: Partial<ApiMunicipality>) => {
    const response = await updateMunicipality(id, data)
    if (response.error) throw new Error(response.error)
    return response.data!
  },
  delete: async (id: string) => {
    const response = await deleteMunicipality(id)
    if (response.error) throw new Error(response.error)
  },
  stats: getMunicipalityStats,
  adjacent: getAdjacentCommunities,
  adjacentAll: getAllAdjacentCommunities,
  censusHistory: getCensusHistory,
}

/**
 * Sites API namespace
 */
export const sites = {
  list: async (filters?: SiteFilters) => {
    const response = await getSites(filters)
    return response.data?.results || []
  },
  get: getSiteById,
  create: async (data: Partial<ApiCollectionSite>) => {
    const response = await createSite(data)
    if (response.error) throw new Error(response.error)
    return response.data!
  },
  update: async (id: string, data: Partial<ApiCollectionSite>) => {
    const response = await updateSite(id, data)
    if (response.error) throw new Error(response.error)
    return response.data!
  },
  delete: async (id: string) => {
    const response = await deleteSite(id)
    if (response.error) throw new Error(response.error)
  },
  forMap: getSitesForMap,
  stats: getSiteStats,
  byProgram: getSitesByProgram,
  export: exportSites,
}

/**
 * Compliance API namespace
 */
export const compliance = {
  analyze: analyzeCompliance,
  calculate: calculateRequirements,
  save: saveComplianceCalculation,
  calculations: {
    list: async () => {
      const response = await getComplianceCalculations()
      return response.data?.results || []
    },
  },
  regulatoryRules: {
    list: async (filters?: { program?: string; category?: string }) => {
      const response = await getRegulatoryRules(filters)
      return response.data?.results || []
    },
    create: async (data: Partial<ApiRegulatoryRule>) => {
      const response = await createRegulatoryRule(data)
      if (response.error) throw new Error(response.error)
      return response.data!
    },
    update: async (id: string, data: Partial<ApiRegulatoryRule>) => {
      const response = await updateRegulatoryRule(id, data)
      if (response.error) throw new Error(response.error)
      return response.data!
    },
    delete: async (id: string) => {
      const response = await deleteRegulatoryRule(id)
      if (response.error) throw new Error(response.error)
    },
  },
}

/**
 * Reallocations API namespace
 */
export const reallocations = {
  list: async (filters?: ReallocationFilters) => {
    const response = await getReallocations(filters)
    return response.data?.results || []
  },
  get: getReallocationById,
  create: async (data: Partial<ApiReallocation>) => {
    const response = await createReallocation(data)
    if (response.error) throw new Error(response.error)
    return response.data!
  },
  approve: approveReallocation,
  reject: rejectReallocation,
  delete: async (id: string) => {
    const response = await deleteReallocation(id)
    if (response.error) throw new Error(response.error)
  },
  stats: getReallocationStats,
}

/**
 * Tools API namespace
 */
export const tools = {
  directServiceOffset: {
    list: getGlobalOffsets,
    create: async (data: { program: string; year: number; global_percentage: number }) => {
      const response = await createGlobalOffset(data)
      if (response.error) throw new Error(response.error)
      return response.data!
    },
    calculate: getToolAOffsets,
    apply: applyToolAOffset,
  },
  communityOffset: {
    list: getCommunityOffsets,
    create: async (data: { community_id: string; program: string; year: number; percentage_override?: number; new_required?: number }) => {
      const response = await createCommunityOffset({
        community: data.community_id,
        program: data.program,
        year: data.year,
        percentage_override: data.percentage_override,
        new_required: data.new_required,
      })
      if (response.error) throw new Error(response.error)
      return response.data!
    },
  },
  eventApplication: {
    list: getEventApplications,
    create: async (data: { community_id: string; event_site_id: string; program: string; year: number }) => {
      const response = await applyEventsToCommunit({
        community_id: data.community_id,
        event_ids: [data.event_site_id],
        program: data.program,
        year: data.year,
      })
      if (response.error) throw new Error(response.error)
      return response.data
    },
    delete: async (id: string) => {
      // Delete event application by ID
      const response = await apiRequest<null>(`/tools/events/applications/${id}/`, { method: "DELETE" })
      if (response.error) throw new Error(response.error)
    },
    applyAll: applyAllEvents,
  },
  adjacentReallocation: {
    getData: getToolCData,
    create: createToolCReallocation,
  },
}

