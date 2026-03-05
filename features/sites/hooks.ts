import { useQuery } from "@tanstack/react-query";
import { fetchSites } from "./api";
import { SitesFilters } from "./types";

export const useSites = (filters: SitesFilters = {}) => {
  return useQuery({
    queryKey: ["sites", filters],
    queryFn: () => fetchSites(filters),
  });
};
