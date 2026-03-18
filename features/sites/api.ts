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

export const createSite = async (siteData: any): Promise<any> => {
  const response = await axiosInstance.post('/api/sites/', siteData);
  return response.data;
};

export const deleteSiteById = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/sites/${id}/`);
};

export const updateSite = async (id: string, siteData: any): Promise<any> => {
  const response = await axiosInstance.put(`/api/sites/${id}/`, siteData);
  return response.data;
};

export const downloadSiteCensusTemplate = async (): Promise<Blob> => {
  const response = await axiosInstance.get('/api/sites/census-data/template/', {
    responseType: 'blob',
  });
  return response.data;
};

export const importSiteCensusData = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post('/api/sites/census-data/import-export/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const exportSiteCensusData = async (): Promise<Blob> => {
  const response = await axiosInstance.get('/api/sites/census-data/import-export/', {
    responseType: 'blob',
  });

  return response.data;
};
