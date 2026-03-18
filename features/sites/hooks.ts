import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSites,
  fetchSiteById,
  createSite,
  deleteSiteById,
  updateSite,
  importSiteCensusData,
  exportSiteCensusData,
} from "./api";
import { SitesFilters } from "./types";

export const useSites = (filters: SitesFilters = {}) => {
  return useQuery({
    queryKey: ["sites", filters],
    queryFn: () => fetchSites(filters),
  });
};

export const useSite = (id: number | undefined) => {
  return useQuery({
    queryKey: ["site", id],
    queryFn: () => fetchSiteById(id!),
    enabled: !!id,
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSiteById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
};

export const useImportSiteCensusData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importSiteCensusData(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
};

export const useExportSiteCensusData = () => {
  return useMutation({
    mutationFn: () => exportSiteCensusData(),
  });
};
