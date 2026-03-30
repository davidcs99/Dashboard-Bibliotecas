import type {
  FiltersApiResponse,
  MonitoringApiResponse,
  ResourcesApiResponse,
  SearchesApiResponse,
  SummaryApiResponse,
  TrendsApiResponse,
  UsersApiResponse
} from "@/types/api";
import type { DashboardAnalytics } from "@/types/dashboard";

export function selectFiltersResponse(
  dashboardAnalytics: DashboardAnalytics
): FiltersApiResponse {
  return {
    filterOptions: dashboardAnalytics.filterOptions
  };
}

export function selectSummaryResponse(
  dashboardAnalytics: DashboardAnalytics
): SummaryApiResponse {
  return {
    filterOptions: dashboardAnalytics.filterOptions,
    summaryKpis: dashboardAnalytics.summaryKpis,
    monthlyUsageTrend: dashboardAnalytics.monthlyUsageTrend,
    usageByCampus: dashboardAnalytics.usageByCampus,
    usageByRole: dashboardAnalytics.usageByRole
  };
}

export function selectResourcesResponse(
  dashboardAnalytics: DashboardAnalytics
): ResourcesApiResponse {
  return {
    filterOptions: dashboardAnalytics.filterOptions,
    topResources: dashboardAnalytics.topResources,
    leastUsedResources: dashboardAnalytics.leastUsedResources,
    resourceUsageByPrimaryRoles: dashboardAnalytics.resourceUsageByPrimaryRoles,
    resourceTypeDistribution: dashboardAnalytics.resourceTypeDistribution,
    uniqueUsersByResource: dashboardAnalytics.uniqueUsersByResource
  };
}

export function selectUsersResponse(
  dashboardAnalytics: DashboardAnalytics
): UsersApiResponse {
  return {
    filterOptions: dashboardAnalytics.filterOptions,
    usageByAcademicUnit: dashboardAnalytics.usageByAcademicUnit,
    usageByProgram: dashboardAnalytics.usageByProgram,
    usersVsEventsByAcademicUnit: dashboardAnalytics.usersVsEventsByAcademicUnit
  };
}

export function selectTrendsResponse(
  dashboardAnalytics: DashboardAnalytics
): TrendsApiResponse {
  return {
    filterOptions: dashboardAnalytics.filterOptions,
    monthlyUsageTrend: dashboardAnalytics.monthlyUsageTrend,
    dailyPeakUsage: dashboardAnalytics.dailyPeakUsage,
    operationTrend: dashboardAnalytics.operationTrend,
    operationTrendByYear: dashboardAnalytics.operationTrendByYear
  };
}

export function selectSearchesResponse(
  dashboardAnalytics: DashboardAnalytics
): SearchesApiResponse {
  return {
    filterOptions: dashboardAnalytics.filterOptions,
    topSearchTerms: dashboardAnalytics.topSearchTerms,
    searchVolumeByCampus: dashboardAnalytics.searchVolumeByCampus
  };
}

export function selectMonitoringResponse(
  dashboardAnalytics: DashboardAnalytics
): MonitoringApiResponse {
  return {
    filterOptions: dashboardAnalytics.filterOptions,
    monitoringUsers: dashboardAnalytics.monitoringUsers
  };
}
