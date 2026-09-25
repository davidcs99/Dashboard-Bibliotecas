import { NextResponse } from "next/server";
import { parseDashboardFiltersFromSearchParams } from "@/lib/dashboard-filters";
import { getSearchesDashboardData } from "@/lib/server/dashboard-analytics-service";

export async function GET(request: Request) {
  const dashboardFilters = parseDashboardFiltersFromSearchParams(new URL(request.url).searchParams);
  return NextResponse.json(await getSearchesDashboardData(dashboardFilters));
}
