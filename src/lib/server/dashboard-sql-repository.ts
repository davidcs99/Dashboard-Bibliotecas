import { getSqlPool } from "@/lib/server/sql-client";
import { buildFilterWhereClause, withFallback } from "@/lib/server/dashboard-filter-sql";
import {
  accumulateResourceUsageByPrimaryRole,
  buildResourceUsageByPrimaryRoles,
  buildSummaryKpis,
  incrementMapCounter,
  monthLabelByNumber,
  sortByCountThenLabel,
  sortLexicographically,
  sortMonthlyMetrics,
  sortOperationTrendMetrics,
  sortOperationYearMetrics,
  takeBottom,
  takeTop
} from "@/lib/server/dashboard-analytics-shaping";
import type {
  CategoryMetric,
  DashboardFilterOptions,
  DashboardQueryFilters,
  KpiMetric,
  MonthlyMetric,
  OperationTrendMetric,
  OperationYearMetric,
  ResourceUsageByRoleMetric,
  ScatterMetric,
  UserMonitoringRow
} from "@/types/dashboard";

const usageViewName = "dbbibliotecas.v_uso_biblioteca";
const resourceAccessOperation = "ACCESO_RECURSO";
const searchOperation = "BUSQUEDA";

async function queryWithFilters<TRow>(
  filters: DashboardQueryFilters,
  buildQuery: (whereClause: string) => string
): Promise<TRow[]> {
  const pool = await getSqlPool();
  const request = pool.request();
  const whereClause = buildFilterWhereClause(request, filters);
  const result = await request.query<TRow>(buildQuery(whereClause));
  return result.recordset;
}

async function queryWithoutFilters<TRow>(sqlText: string): Promise<TRow[]> {
  const pool = await getSqlPool();
  const result = await pool.request().query<TRow>(sqlText);
  return result.recordset;
}

function monthKeyFrom(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

export async function getFilterOptionsFromSql(): Promise<DashboardFilterOptions> {
  const [
    yearRows,
    monthRows,
    modalityRows,
    accessTypeRows,
    campusRows,
    academicUnitRows,
    programRows,
    roleRows,
    resourceRows,
    resourceTypeRows,
    userRows
  ] = await Promise.all([
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT CAST(anio AS varchar(4)) AS value FROM ${usageViewName} WHERE anio IS NOT NULL ORDER BY value`
    ),
    queryWithoutFilters<{ mes: number }>(
      `SELECT DISTINCT mes FROM ${usageViewName} WHERE mes IS NOT NULL ORDER BY mes`
    ),
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT modalidad AS value FROM ${usageViewName} WHERE modalidad IS NOT NULL ORDER BY modalidad`
    ),
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT tipoAcceso AS value FROM ${usageViewName} WHERE tipoAcceso IS NOT NULL ORDER BY tipoAcceso`
    ),
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT ${withFallback("sede")} AS value FROM ${usageViewName}
       WHERE operacion = '${resourceAccessOperation}' ORDER BY value`
    ),
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT ${withFallback("ua")} AS value FROM ${usageViewName}
       WHERE operacion = '${resourceAccessOperation}' ORDER BY value`
    ),
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT ${withFallback("carrera")} AS value FROM ${usageViewName}
       WHERE operacion = '${resourceAccessOperation}' ORDER BY value`
    ),
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT ${withFallback("cargo")} AS value FROM ${usageViewName}
       WHERE operacion = '${resourceAccessOperation}' ORDER BY value`
    ),
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT ${withFallback("recurso")} AS value FROM ${usageViewName}
       WHERE operacion = '${resourceAccessOperation}' ORDER BY value`
    ),
    queryWithoutFilters<{ value: string }>(
      `SELECT DISTINCT ${withFallback("tipoRecurso")} AS value FROM ${usageViewName}
       WHERE operacion = '${resourceAccessOperation}' ORDER BY value`
    ),
    queryWithoutFilters<{ identificacion: string; nombre: string }>(
      `SELECT DISTINCT TOP 300 identificacion, nombre FROM ${usageViewName}
       WHERE identificacion IS NOT NULL AND identificacion <> ''
         AND nombre IS NOT NULL AND nombre <> ''
       ORDER BY nombre`
    )
  ]);

  return {
    years: sortLexicographically(yearRows.map((row) => row.value)),
    months: sortLexicographically(
      monthRows.map((row) => monthLabelByNumber.get(String(row.mes).padStart(2, "0")) ?? "")
    ).filter(Boolean),
    campuses: sortLexicographically(campusRows.map((row) => row.value)),
    academicUnits: sortLexicographically(academicUnitRows.map((row) => row.value)),
    programs: sortLexicographically(programRows.map((row) => row.value)),
    modalities: sortLexicographically(modalityRows.map((row) => row.value)),
    accessTypes: sortLexicographically(accessTypeRows.map((row) => row.value)),
    roles: sortLexicographically(roleRows.map((row) => row.value)),
    resources: sortLexicographically(resourceRows.map((row) => row.value)),
    resourceTypes: sortLexicographically(resourceTypeRows.map((row) => row.value)),
    users: userRows.map((row) => `${row.identificacion} - ${row.nombre}`)
  };
}

export async function getMonthlyUsageTrendFromSql(filters: DashboardQueryFilters): Promise<MonthlyMetric[]> {
  const rows = await queryWithFilters<{ anio: number; mes: number; total: number }>(
    filters,
    (whereClause) => `
      SELECT anio, mes, COUNT(*) AS total
      FROM ${usageViewName}
      WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
      GROUP BY anio, mes
    `
  );

  const monthlyUsageTrend = new Map<string, number>();
  for (const row of rows) {
    incrementMapCounter(monthlyUsageTrend, monthKeyFrom(row.anio, row.mes), row.total);
  }

  return sortMonthlyMetrics(monthlyUsageTrend);
}

export async function getSummaryMetricsFromSql(filters: DashboardQueryFilters): Promise<{
  summaryKpis: KpiMetric[];
  monthlyUsageTrend: MonthlyMetric[];
  usageByCampus: CategoryMetric[];
  usageByRole: CategoryMetric[];
}> {
  const [totalsRows, monthlyUsageTrend, campusRows, roleRows] = await Promise.all([
    queryWithFilters<{ totalEvents: number; uniqueUsers: number; totalSearches: number; totalResourceAccesses: number }>(
      filters,
      (whereClause) => `
        SELECT
          COUNT(*) AS totalEvents,
          COUNT(DISTINCT NULLIF(identificacion, '')) AS uniqueUsers,
          SUM(CASE WHEN operacion = '${searchOperation}' THEN 1 ELSE 0 END) AS totalSearches,
          SUM(CASE WHEN operacion = '${resourceAccessOperation}' THEN 1 ELSE 0 END) AS totalResourceAccesses
        FROM ${usageViewName}
        WHERE ${whereClause}
      `
    ),
    getMonthlyUsageTrendFromSql(filters),
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("sede")} AS label, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
        GROUP BY ${withFallback("sede")}
      `
    ),
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("cargo")} AS label, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
        GROUP BY ${withFallback("cargo")}
      `
    )
  ]);

  const totals = totalsRows[0] ?? {
    totalEvents: 0,
    uniqueUsers: 0,
    totalSearches: 0,
    totalResourceAccesses: 0
  };

  const usageByCampus = new Map(campusRows.map((row) => [row.label, row.total]));
  const usageByRole = new Map(roleRows.map((row) => [row.label, row.total]));

  return {
    summaryKpis: buildSummaryKpis(
      totals.totalEvents,
      totals.uniqueUsers,
      totals.totalSearches,
      totals.totalResourceAccesses
    ),
    monthlyUsageTrend,
    usageByCampus: takeTop(sortByCountThenLabel(usageByCampus), 10),
    usageByRole: takeTop(sortByCountThenLabel(usageByRole), 10)
  };
}

export async function getResourcesMetricsFromSql(filters: DashboardQueryFilters): Promise<{
  topResources: CategoryMetric[];
  leastUsedResources: CategoryMetric[];
  resourceUsageByPrimaryRoles: ResourceUsageByRoleMetric[];
  resourceTypeDistribution: CategoryMetric[];
  uniqueUsersByResource: CategoryMetric[];
}> {
  const [resourceRows, resourceTypeRows, uniqueUsersRows, roleRows] = await Promise.all([
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("recurso")} AS label, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
        GROUP BY ${withFallback("recurso")}
      `
    ),
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("tipoRecurso")} AS label, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
        GROUP BY ${withFallback("tipoRecurso")}
      `
    ),
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("recurso")} AS label, COUNT(DISTINCT NULLIF(identificacion, '')) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
        GROUP BY ${withFallback("recurso")}
      `
    ),
    queryWithFilters<{ resource: string; role: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("recurso")} AS resource, cargo AS role, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}' AND cargo IN ('ALUMNO', 'DOCENTE')
        GROUP BY ${withFallback("recurso")}, cargo
      `
    )
  ]);

  const topResources = new Map(resourceRows.map((row) => [row.label, row.total]));
  const resourceTypeDistribution = new Map(resourceTypeRows.map((row) => [row.label, row.total]));
  const uniqueUsersByResource = new Map(uniqueUsersRows.map((row) => [row.label, row.total]));

  const resourceUsageByRole = new Map<string, ResourceUsageByRoleMetric>();
  for (const row of roleRows) {
    accumulateResourceUsageByPrimaryRole(resourceUsageByRole, row.resource, row.role, row.total);
  }

  const sortedResources = sortByCountThenLabel(topResources);

  return {
    topResources: takeTop(sortedResources, 10),
    leastUsedResources: takeBottom(sortedResources, 10),
    resourceUsageByPrimaryRoles: buildResourceUsageByPrimaryRoles(resourceUsageByRole),
    resourceTypeDistribution: takeTop(sortByCountThenLabel(resourceTypeDistribution), 10),
    uniqueUsersByResource: takeTop(sortByCountThenLabel(uniqueUsersByResource), 10)
  };
}

export async function getUsersMetricsFromSql(filters: DashboardQueryFilters): Promise<{
  usageByAcademicUnit: CategoryMetric[];
  usageByProgram: CategoryMetric[];
  usersVsEventsByAcademicUnit: ScatterMetric[];
}> {
  const [academicUnitRows, programRows, academicUnitUsersRows] = await Promise.all([
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("ua")} AS label, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
        GROUP BY ${withFallback("ua")}
      `
    ),
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("carrera")} AS label, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
        GROUP BY ${withFallback("carrera")}
      `
    ),
    queryWithFilters<{ label: string; total: number; uniqueUsers: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("ua")} AS label, COUNT(*) AS total, COUNT(DISTINCT NULLIF(identificacion, '')) AS uniqueUsers
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${resourceAccessOperation}'
        GROUP BY ${withFallback("ua")}
      `
    )
  ]);

  const usageByAcademicUnit = new Map(academicUnitRows.map((row) => [row.label, row.total]));
  const usageByProgram = new Map(programRows.map((row) => [row.label, row.total]));

  const usersVsEventsByAcademicUnit: ScatterMetric[] = academicUnitUsersRows
    .map((row) => ({ name: row.label, events: row.total, users: row.uniqueUsers }))
    .sort((leftItem, rightItem) => rightItem.events - leftItem.events)
    .slice(0, 12);

  return {
    usageByAcademicUnit: takeTop(sortByCountThenLabel(usageByAcademicUnit), 10),
    usageByProgram: takeTop(sortByCountThenLabel(usageByProgram), 10),
    usersVsEventsByAcademicUnit
  };
}

export async function getTrendsMetricsFromSql(filters: DashboardQueryFilters): Promise<{
  dailyPeakUsage: CategoryMetric[];
  operationTrend: OperationTrendMetric[];
  operationTrendByYear: OperationYearMetric[];
}> {
  const [dailyRows, operationRows] = await Promise.all([
    queryWithFilters<{ day: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT CONVERT(varchar(10), fecha, 23) AS day, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE ${whereClause}
        GROUP BY CONVERT(varchar(10), fecha, 23)
      `
    ),
    queryWithFilters<{ anio: number; mes: number; operacion: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT anio, mes, operacion, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE ${whereClause}
        GROUP BY anio, mes, operacion
      `
    )
  ]);

  const dailyPeakUsage = new Map(dailyRows.map((row) => [row.day, row.total]));

  const operationTrendByMonth = new Map<string, OperationTrendMetric>();
  const operationTrendByYear = new Map<string, OperationYearMetric>();

  for (const row of operationRows) {
    const monthKey = monthKeyFrom(row.anio, row.mes);
    const yearKey = String(row.anio);

    const monthTrend = operationTrendByMonth.get(monthKey) ?? {
      month: monthKey,
      url: 0,
      loginSuccess: 0,
      search: 0
    };
    const yearTrend = operationTrendByYear.get(yearKey) ?? {
      year: yearKey,
      url: 0,
      loginSuccess: 0,
      search: 0
    };

    if (row.operacion === resourceAccessOperation) {
      monthTrend.url += row.total;
      yearTrend.url += row.total;
    }

    if (row.operacion === searchOperation) {
      monthTrend.search += row.total;
      yearTrend.search += row.total;
    }

    if (row.operacion === "LOGIN") {
      monthTrend.loginSuccess += row.total;
      yearTrend.loginSuccess += row.total;
    }

    operationTrendByMonth.set(monthKey, monthTrend);
    operationTrendByYear.set(yearKey, yearTrend);
  }

  return {
    dailyPeakUsage: takeTop(sortByCountThenLabel(dailyPeakUsage), 10),
    operationTrend: sortOperationTrendMetrics(operationTrendByMonth),
    operationTrendByYear: sortOperationYearMetrics(operationTrendByYear)
  };
}

export async function getSearchesMetricsFromSql(filters: DashboardQueryFilters): Promise<{
  topSearchTerms: CategoryMetric[];
  searchVolumeByCampus: CategoryMetric[];
}> {
  const [searchTermRows, campusRows] = await Promise.all([
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT TOP 10 LOWER(LTRIM(RTRIM(busqueda))) AS label, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${searchOperation}'
          AND busqueda IS NOT NULL AND LTRIM(RTRIM(busqueda)) <> ''
        GROUP BY LOWER(LTRIM(RTRIM(busqueda)))
        ORDER BY COUNT(*) DESC
      `
    ),
    queryWithFilters<{ label: string; total: number }>(
      filters,
      (whereClause) => `
        SELECT ${withFallback("sede")} AS label, COUNT(*) AS total
        FROM ${usageViewName}
        WHERE (${whereClause}) AND operacion = '${searchOperation}'
        GROUP BY ${withFallback("sede")}
      `
    )
  ]);

  return {
    topSearchTerms: searchTermRows.map((row) => ({ label: row.label, value: row.total })),
    searchVolumeByCampus: takeTop(
      sortByCountThenLabel(new Map(campusRows.map((row) => [row.label, row.total]))),
      10
    )
  };
}

export async function getMonitoringMetricsFromSql(filters: DashboardQueryFilters): Promise<{
  monitoringUsers: UserMonitoringRow[];
}> {
  const rows = await queryWithFilters<{
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
  }>(
    filters,
    (whereClause) => `
      WITH filtered AS (
        SELECT *
        FROM ${usageViewName}
        WHERE (${whereClause}) AND identificacion IS NOT NULL AND identificacion <> ''
      ),
      enriched AS (
        SELECT
          identificacion,
          nombre,
          cargo,
          ua,
          carrera,
          sede,
          COUNT(*) OVER (PARTITION BY identificacion) AS totalEvents,
          SUM(CASE WHEN operacion = '${searchOperation}' THEN 1 ELSE 0 END)
            OVER (PARTITION BY identificacion) AS totalSearches,
          SUM(CASE WHEN operacion = '${resourceAccessOperation}' THEN 1 ELSE 0 END)
            OVER (PARTITION BY identificacion) AS totalResourceAccesses,
          MIN(fecha) OVER (PARTITION BY identificacion) AS firstUsageDate,
          MAX(fecha) OVER (PARTITION BY identificacion) AS lastUsageDate,
          ROW_NUMBER() OVER (PARTITION BY identificacion ORDER BY fecha ASC) AS rowNumber
        FROM filtered
      )
      SELECT TOP 100
        identificacion AS identification,
        nombre AS fullName,
        cargo AS role,
        ua AS academicUnit,
        carrera AS program,
        sede AS campus,
        totalEvents,
        totalSearches,
        totalResourceAccesses,
        CONVERT(varchar(33), firstUsageDate, 126) AS firstUsageDate,
        CONVERT(varchar(33), lastUsageDate, 126) AS lastUsageDate
      FROM enriched
      WHERE rowNumber = 1
      ORDER BY totalEvents DESC
    `
  );

  return {
    monitoringUsers: rows.map((row) => ({
      identification: row.identification,
      fullName: row.fullName ?? "",
      role: row.role ?? "SIN CARGO",
      academicUnit: row.academicUnit ?? "SIN UNIDAD ACADEMICA",
      program: row.program ?? "SIN CARRERA",
      campus: row.campus ?? "SIN SEDE",
      totalEvents: row.totalEvents,
      totalSearches: row.totalSearches,
      totalResourceAccesses: row.totalResourceAccesses,
      firstUsageDate: row.firstUsageDate,
      lastUsageDate: row.lastUsageDate
    }))
  };
}
