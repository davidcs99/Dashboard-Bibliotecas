import type { DashboardQueryFilters } from "@/types/dashboard";

export const emptyDashboardQueryFilters: DashboardQueryFilters = {
  years: [],
  months: [],
  campuses: [],
  academicUnits: [],
  programs: [],
  modalities: [],
  roles: [],
  resources: [],
  resourceTypes: [],
  users: []
};

const filterKeyByQueryParameter: Record<keyof DashboardQueryFilters, string> = {
  years: "year",
  months: "month",
  campuses: "campus",
  academicUnits: "academicUnit",
  programs: "program",
  modalities: "modality",
  roles: "role",
  resources: "resource",
  resourceTypes: "resourceType",
  users: "user"
};

export function buildDashboardFiltersQueryString(
  filters: DashboardQueryFilters
): string {
  const searchParameters = new URLSearchParams();

  for (const [filterKey, queryParameterName] of Object.entries(
    filterKeyByQueryParameter
  ) as Array<[keyof DashboardQueryFilters, string]>) {
    for (const filterValue of filters[filterKey]) {
      searchParameters.append(queryParameterName, filterValue);
    }
  }

  const serializedFilters = searchParameters.toString();
  return serializedFilters ? `?${serializedFilters}` : "";
}

export function parseDashboardFiltersFromSearchParams(
  searchParameters: URLSearchParams
): DashboardQueryFilters {
  return {
    years: searchParameters.getAll("year"),
    months: searchParameters.getAll("month"),
    campuses: searchParameters.getAll("campus"),
    academicUnits: searchParameters.getAll("academicUnit"),
    programs: searchParameters.getAll("program"),
    modalities: searchParameters.getAll("modality"),
    roles: searchParameters.getAll("role"),
    resources: searchParameters.getAll("resource"),
    resourceTypes: searchParameters.getAll("resourceType"),
    users: searchParameters.getAll("user")
  };
}

export function hasActiveDashboardFilters(filters: DashboardQueryFilters): boolean {
  return Object.values(filters).some((values) => values.length > 0);
}
