export interface Site {
  id: number;
  site: string;
  census_year: number;
  census_year_value: number;
  community: string;
  community_name: string;
  site_type: string;
  operator_type: string;
  service_partner: string;
  address_line_1: string;
  address_line_2: string;
  address_city: string;
  address_postal_code: string;
  region: string;
  service_area: string;
  address_latitude: string;
  address_longitude: string;
  latitude: string;
  longitude: string;
  is_active: boolean;
  site_start_date: string | null;
  site_end_date: string | null;
  program_paint: boolean;
  program_paint_start_date: string | null;
  program_paint_end_date: string | null;
  program_lights: boolean;
  program_lights_start_date: string | null;
  program_lights_end_date: string | null;
  program_solvents: boolean;
  program_solvents_start_date: string | null;
  program_solvents_end_date: string | null;
  program_pesticides: boolean;
  program_pesticides_start_date: string | null;
  program_pesticides_end_date: string | null;
  program_fertilizers: boolean;
  program_fertilizers_start_date: string | null;
  program_fertilizers_end_date: string | null;
  created_at: string;
  updated_at: string;
  site_name: string;
}

export interface PaginatedSitesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Site[];
}

export interface SitesFilters {
  search?: string;
  status?: string;
  site_type?: string;
  operator_type?: string;
  residential?: boolean;
  sort?: string;
  year?: number;
  is_active?: boolean;
  page?: number;
  limit?: number;
}
