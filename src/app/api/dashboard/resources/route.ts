import { NextResponse } from "next/server";
import { parseDashboardFiltersFromSearchParams } from "@/lib/dashboard-filters";
import { getResourcesDashboardData } from "@/lib/server/dashboard-analytics-service";

export async function GET(request: Request) {
  const dashboardFilters = parseDashboardFiltersFromSearchParams(new URL(request.url).searchParams);
  return NextResponse.json(await getResourcesDashboardData(dashboardFilters));
}
