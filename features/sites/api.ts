import axiosInstance from '@/lib/axios-instance'
import { PaginatedSitesResponse, SitesFilters, Site } from "./types";

export const fetchSites = async (filters: SitesFilters = {}): Promise<PaginatedSitesResponse> => {
  const queryParams = new URLSearchParams();

  if (filters.search) queryParams.append("search", filters.search);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.site_type) queryParams.append("site_type", filters.site_type);
  if (filters.residential !== undefined) queryParams.append("residential", filters.residential.toString());
  if (filters.sort) queryParams.append("sort", filters.sort);
  if (filters.year !== undefined) queryParams.append("year", filters.year.toString());
  if (filters.is_active !== undefined) queryParams.append("is_active", filters.is_active.toString());
  if (filters.page !== undefined) queryParams.append("page", filters.page.toString());
  if (filters.limit !== undefined) queryParams.append("limit", filters.limit.toString());

  const response = await axiosInstance.get(`/api/sites?${queryParams.toString()}`);
  return response.data;
};

export const fetchSiteById = async (id: number): Promise<Site> => {
  const response = await axiosInstance.get(`/api/sites/${id}`);
  return response.data;
};

export const deleteSiteById = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/sites/${id}`);
};
