"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchResources } from "@/services/dashboard-api";
import { useDashboardQueryFilters } from "@/hooks/use-dashboard-query-filters";

export function useResourcesQuery() {
  const filters = useDashboardQueryFilters();

  return useQuery({
    queryKey: ["dashboard", "resources", filters],
    queryFn: () => fetchResources(filters),
    placeholderData: (previousData) => previousData
  });
}
