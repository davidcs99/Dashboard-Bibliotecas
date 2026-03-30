import type {
  FiltersApiResponse,
  MonitoringApiResponse,
  ResourcesApiResponse,
  SearchesApiResponse,
  SummaryApiResponse,
  TrendsApiResponse,
  UsersApiResponse
} from "@/types/api";
import type { DashboardQueryFilters } from "@/types/dashboard";
import { buildDashboardFiltersQueryString } from "@/lib/dashboard-filters";

async function fetchJson<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url} with status ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export function fetchFilters(): Promise<FiltersApiResponse> {
  return fetchJson<FiltersApiResponse>("/api/dashboard/filters");
}

export function fetchSummary(filters: DashboardQueryFilters): Promise<SummaryApiResponse> {
  return fetchJson<SummaryApiResponse>(`/api/dashboard/summary${buildDashboardFiltersQueryString(filters)}`);
}

export function fetchResources(filters: DashboardQueryFilters): Promise<ResourcesApiResponse> {
  return fetchJson<ResourcesApiResponse>(`/api/dashboard/resources${buildDashboardFiltersQueryString(filters)}`);
}

export function fetchUsers(filters: DashboardQueryFilters): Promise<UsersApiResponse> {
  return fetchJson<UsersApiResponse>(`/api/dashboard/users${buildDashboardFiltersQueryString(filters)}`);
}

export function fetchTrends(filters: DashboardQueryFilters): Promise<TrendsApiResponse> {
  return fetchJson<TrendsApiResponse>(`/api/dashboard/trends${buildDashboardFiltersQueryString(filters)}`);
}

export function fetchSearches(filters: DashboardQueryFilters): Promise<SearchesApiResponse> {
  return fetchJson<SearchesApiResponse>(`/api/dashboard/searches${buildDashboardFiltersQueryString(filters)}`);
}

export function fetchMonitoring(filters: DashboardQueryFilters): Promise<MonitoringApiResponse> {
  return fetchJson<MonitoringApiResponse>(`/api/dashboard/monitoring${buildDashboardFiltersQueryString(filters)}`);
}
