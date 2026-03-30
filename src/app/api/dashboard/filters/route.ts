import { NextResponse } from "next/server";
import { getDashboardAnalytics } from "@/lib/server/dashboard-analytics-service";
import { selectFiltersResponse } from "@/lib/server/dashboard-api-selectors";

export async function GET() {
  const dashboardAnalytics = await getDashboardAnalytics();
  return NextResponse.json(selectFiltersResponse(dashboardAnalytics));
}
