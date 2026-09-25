import { NextResponse } from "next/server";
import { getFiltersDashboardData } from "@/lib/server/dashboard-analytics-service";

export async function GET() {
  return NextResponse.json(await getFiltersDashboardData());
}
