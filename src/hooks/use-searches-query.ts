"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSearches } from "@/services/dashboard-api";
import { useDashboardQueryFilters } from "@/hooks/use-dashboard-query-filters";

export function useSearchesQuery() {
  const filters = useDashboardQueryFilters();

  return useQuery({
    queryKey: ["dashboard", "searches", filters],
    queryFn: () => fetchSearches(filters),
    placeholderData: (previousData) => previousData
  });
}
