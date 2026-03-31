export type KpiMetric = {
  label: string;
  value: string;
  supportingText: string;
};

export type CategoryMetric = {
  label: string;
  value: number;
};

export type MonthlyMetric = {
  month: string;
  value: number;
};

export type OperationTrendMetric = {
  month: string;
  url: number;
  loginSuccess: number;
  search: number;
};

export type OperationYearMetric = {
  year: string;
  url: number;
  loginSuccess: number;
  search: number;
};

export type ResourceUsageByRoleMetric = {
  resource: string;
  student: number;
  teacher: number;
};

export type ScatterMetric = {
  name: string;
  users: number;
  events: number;
};

export type UserMonitoringRow = {
  identification: string;
  fullName: string;
  role: string;
  academicUnit: string;
  program: string;
  campus: string;
  totalEvents: number;
  totalSearches: number;
  totalResourceAccesses: number;
  firstUsageDate: string;
  lastUsageDate: string;
};

export type DashboardFilterOptions = {
  years: string[];
  months: string[];
  campuses: string[];
  academicUnits: string[];
  programs: string[];
  modalities: string[];
  accessTypes: string[];
  roles: string[];
  resources: string[];
  resourceTypes: string[];
  users: string[];
};

export type DashboardQueryFilters = {
  years: string[];
  months: string[];
  campuses: string[];
  academicUnits: string[];
  programs: string[];
  modalities: string[];
  accessTypes: string[];
  roles: string[];
  resources: string[];
  resourceTypes: string[];
  users: string[];
};

export type DashboardAnalytics = {
  filterOptions: DashboardFilterOptions;
  summaryKpis: KpiMetric[];
  monthlyUsageTrend: MonthlyMetric[];
  usageByCampus: CategoryMetric[];
  usageByRole: CategoryMetric[];
  topResources: CategoryMetric[];
  leastUsedResources: CategoryMetric[];
  resourceUsageByPrimaryRoles: ResourceUsageByRoleMetric[];
  resourceTypeDistribution: CategoryMetric[];
  uniqueUsersByResource: CategoryMetric[];
  usageByAcademicUnit: CategoryMetric[];
  usageByProgram: CategoryMetric[];
  usersVsEventsByAcademicUnit: ScatterMetric[];
  dailyPeakUsage: CategoryMetric[];
  operationTrend: OperationTrendMetric[];
  operationTrendByYear: OperationYearMetric[];
  topSearchTerms: CategoryMetric[];
  searchVolumeByCampus: CategoryMetric[];
  monitoringUsers: UserMonitoringRow[];
};
