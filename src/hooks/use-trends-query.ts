"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTrends } from "@/services/dashboard-api";
import { useDashboardQueryFilters } from "@/hooks/use-dashboard-query-filters";

export function useTrendsQuery() {
  const filters = useDashboardQueryFilters();

  return useQuery({
    queryKey: ["dashboard", "trends", filters],
    queryFn: () => fetchTrends(filters),
    placeholderData: (previousData) => previousData
  });
}
