"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSummary } from "@/services/dashboard-api";
import { useDashboardQueryFilters } from "@/hooks/use-dashboard-query-filters";

export function useSummaryQuery() {
  const filters = useDashboardQueryFilters();

  return useQuery({
    queryKey: ["dashboard", "summary", filters],
    queryFn: () => fetchSummary(filters),
    placeholderData: (previousData) => previousData
  });
}
