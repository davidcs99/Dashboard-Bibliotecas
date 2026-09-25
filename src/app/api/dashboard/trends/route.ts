import { NextResponse } from "next/server";
import { parseDashboardFiltersFromSearchParams } from "@/lib/dashboard-filters";
import { getTrendsDashboardData } from "@/lib/server/dashboard-analytics-service";

export async function GET(request: Request) {
  const dashboardFilters = parseDashboardFiltersFromSearchParams(new URL(request.url).searchParams);
  return NextResponse.json(await getTrendsDashboardData(dashboardFilters));
}
