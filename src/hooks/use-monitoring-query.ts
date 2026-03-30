"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMonitoring } from "@/services/dashboard-api";
import { useDashboardQueryFilters } from "@/hooks/use-dashboard-query-filters";

export function useMonitoringQuery() {
  const filters = useDashboardQueryFilters();

  return useQuery({
    queryKey: ["dashboard", "monitoring", filters],
    queryFn: () => fetchMonitoring(filters),
    placeholderData: (previousData) => previousData
  });
}
