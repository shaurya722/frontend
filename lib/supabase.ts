/**
 * Database Types
 * 
 * These types are used throughout the frontend application.
 * Data is fetched from the Django backend API (lib/api.ts).
 */

// Database types
export interface User {
  id: string
  username: string
  email: string
  name: string
  role: "Administrator" | "Compliance Analyst" | "Viewer"
  created_at: string
  updated_at: string
  last_login?: string
  is_active: boolean
}

export interface Municipality {
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

export type Community = Municipality

export interface CollectionSite {
  id: string
  name: string
  address: string
  address_line1?: string
  address_line2?: string
  city?: string
  state_province?: string
  postal_code?: string
  municipality_id: string
  municipality?: Municipality
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

export interface Reallocation {
  id: string
  site_id: string
  site?: CollectionSite
  from_municipality_id: string
  from_municipality?: Municipality
  to_municipality_id: string
  to_municipality?: Municipality
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

export interface ComplianceCalculation {
  id: string
  municipality_id: string
  municipality?: Municipality
  program: string
  required_sites: number
  actual_sites: number
  shortfall: number
  excess: number
  compliance_rate: number
  calculation_date: string
  created_by?: string
}

export interface RegulatoryRule {
  id: string
  name: string
  description: string
  program: string
  category: string
  rule_type: string
  parameters: Record<string, any>
  status: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CensusDataHistory {
  id: string
  community_id: string
  census_year: number
  population: number
  created_at: string
  updated_at: string
}

export interface AdjacentCommunity {
  id: string
  community_id: string
  adjacent_community_id: string
  created_at: string
}

export interface DirectServiceOffset {
  id: string
  program: string
  year: number
  global_percentage: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CommunityOffset {
  id: string
  community_id: string
  program: string
  year: number
  percentage_override?: number
  new_required?: number
  created_at: string
  updated_at: string
}

export interface EventApplication {
  id: string
  community_id: string
  event_site_id: string
  program: string
  year: number
  applied_at: string
  applied_by?: string
}

export const OPERATOR_TYPES = [
  "Retailer",
  "Distributor",
  "Municipal",
  "First Nation/Indigenous",
  "Private Depot",
  "Product Care",
  "Regional District",
  "Regional Service Commission",
  "Other",
] as const

export const NON_REALLOCATABLE_OPERATORS = ["Municipal", "First Nation/Indigenous", "Regional District"]

export const SITE_TYPES = ["Collection Site", "Event"] as const

/**
 * @deprecated Use lib/api.ts for API calls instead
 * This function is kept for backwards compatibility but returns null
 */
export function getSupabase(): null {
  console.warn("[supabase] Supabase is deprecated. Use lib/api.ts for API calls.")
  return null
}
