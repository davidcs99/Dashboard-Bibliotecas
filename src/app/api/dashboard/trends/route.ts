import { NextResponse } from "next/server";
import { parseDashboardFiltersFromSearchParams } from "@/lib/dashboard-filters";
import { getDashboardAnalytics } from "@/lib/server/dashboard-analytics-service";
import { selectTrendsResponse } from "@/lib/server/dashboard-api-selectors";

export async function GET(request: Request) {
  const dashboardFilters = parseDashboardFiltersFromSearchParams(new URL(request.url).searchParams);
  const dashboardAnalytics = await getDashboardAnalytics(dashboardFilters);
  return NextResponse.json(selectTrendsResponse(dashboardAnalytics));
}
