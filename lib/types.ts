// Type definitions for the application - Static UI only

export interface Municipality {
  id: string | number
  name: string
  population?: number
  region?: string
  province?: string
  tier?: string
  census_year?: number
  created_at?: string
  updated_at?: string
}

export interface CollectionSite {
  id: string | number
  name: string
  address: string
  address_line1?: string
  address_line2?: string
  city?: string
  state_province?: string
  postal_code?: string
  municipality_id: string
  municipality?: Municipality
  programs: string[]
  site_type: string
  operator_type: string
  service_partner?: string
  materials_collected?: string[]
  collection_scope?: string[]
  community?: string
  region_district?: string
  service_area?: number
  status: "Active" | "Inactive" | "Scheduled" | "Pending" | "Deactivated"
  latitude?: number
  longitude?: number
  active_dates?: string
  population_served?: number
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  email: string
  name?: string
  username?: string
  role: string
  is_active?: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
}

export interface RegulatoryRule {
  id: string | number
  rule_name: string
  name?: string
  description?: string
  rule_type: string
  program?: string
  category?: string
  status?: string
  parameters?: any
  is_active: boolean
  created_at?: string
  updated_at?: string
}
