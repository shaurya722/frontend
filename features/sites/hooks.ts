import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSites, fetchSiteById, deleteSiteById } from "./api";
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

export const useDeleteSite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSiteById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
};
