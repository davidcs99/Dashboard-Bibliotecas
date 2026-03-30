"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/services/dashboard-api";
import { useDashboardQueryFilters } from "@/hooks/use-dashboard-query-filters";

export function useUsersQuery() {
  const filters = useDashboardQueryFilters();

  return useQuery({
    queryKey: ["dashboard", "users", filters],
    queryFn: () => fetchUsers(filters),
    placeholderData: (previousData) => previousData
  });
}
