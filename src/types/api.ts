import type {
  CategoryMetric,
  DashboardFilterOptions,
  KpiMetric,
  MonthlyMetric,
  OperationYearMetric,
  OperationTrendMetric,
  ResourceUsageByRoleMetric,
  ScatterMetric,
  UserMonitoringRow
} from "@/types/dashboard";

export type FiltersApiResponse = {
  filterOptions: DashboardFilterOptions;
};

export type SummaryApiResponse = {
  filterOptions: DashboardFilterOptions;
  summaryKpis: KpiMetric[];
  monthlyUsageTrend: MonthlyMetric[];
  usageByCampus: CategoryMetric[];
  usageByRole: CategoryMetric[];
};

export type ResourcesApiResponse = {
  filterOptions: DashboardFilterOptions;
  topResources: CategoryMetric[];
  leastUsedResources: CategoryMetric[];
  resourceUsageByPrimaryRoles: ResourceUsageByRoleMetric[];
  resourceTypeDistribution: CategoryMetric[];
  uniqueUsersByResource: CategoryMetric[];
};

export type UsersApiResponse = {
  filterOptions: DashboardFilterOptions;
  usageByAcademicUnit: CategoryMetric[];
  usageByProgram: CategoryMetric[];
  usersVsEventsByAcademicUnit: ScatterMetric[];
};

export type TrendsApiResponse = {
  filterOptions: DashboardFilterOptions;
  monthlyUsageTrend: MonthlyMetric[];
  dailyPeakUsage: CategoryMetric[];
  operationTrend: OperationTrendMetric[];
  operationTrendByYear: OperationYearMetric[];
};

export type SearchesApiResponse = {
  filterOptions: DashboardFilterOptions;
  topSearchTerms: CategoryMetric[];
  searchVolumeByCampus: CategoryMetric[];
};

export type MonitoringApiResponse = {
  filterOptions: DashboardFilterOptions;
  monitoringUsers: UserMonitoringRow[];
};
