import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { emptyDashboardQueryFilters, hasActiveDashboardFilters } from "@/lib/dashboard-filters";
import { getSqlPool } from "@/lib/server/sql-client";
import { getRedisClient } from "@/lib/server/redis-client";
import {
  addOption,
  addToSetMap,
  buildAcademicUnitScatterMetrics,
  buildResourceUsageByPrimaryRoles,
  buildSummaryKpis,
  buildUniqueUserMetrics,
  incrementMapCounter,
  monthLabelByNumber,
  sortByCountThenLabel,
  sortLexicographically,
  sortMapLabelsAlphabetically,
  sortMonthlyMetrics,
  sortOperationTrendMetrics,
  sortOperationYearMetrics,
  takeBottom,
  takeTop,
  accumulateResourceUsageByPrimaryRole
} from "@/lib/server/dashboard-analytics-shaping";
import {
  getFilterOptionsFromSql,
  getMonitoringMetricsFromSql,
  getMonthlyUsageTrendFromSql,
  getResourcesMetricsFromSql,
  getSearchesMetricsFromSql,
  getSummaryMetricsFromSql,
  getTrendsMetricsFromSql,
  getUsersMetricsFromSql
} from "@/lib/server/dashboard-sql-repository";
import {
  selectFiltersResponse,
  selectMonitoringResponse,
  selectResourcesResponse,
  selectSearchesResponse,
  selectSummaryResponse,
  selectTrendsResponse,
  selectUsersResponse
} from "@/lib/server/dashboard-api-selectors";
import type {
  DashboardAnalytics,
  DashboardFilterOptions,
  DashboardQueryFilters,
  OperationYearMetric,
  OperationTrendMetric,
  ResourceUsageByRoleMetric,
  UserMonitoringRow
} from "@/types/dashboard";
import type {
  FiltersApiResponse,
  MonitoringApiResponse,
  ResourcesApiResponse,
  SearchesApiResponse,
  SummaryApiResponse,
  TrendsApiResponse,
  UsersApiResponse
} from "@/types/api";

type LibraryUsageRecord = {
  fecha: string;
  identificacion: string;
  nombre: string;
  cargo: string;
  carrera: string;
  modalidad: string;
  tipoAcceso: string;
  ua: string;
  sede: string;
  operacion: string;
  busqueda: string;
  recurso: string;
  tipoRecurso: string;
  anio: string;
  mes: string;
  monthLabel: string;
  userLabel: string;
};

type UserAccumulator = {
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

type DatasetCache = {
  datasetVersion: string;
  records: LibraryUsageRecord[];
};

let cachedBaseAnalyticsPromise: Promise<DashboardAnalytics> | null = null;
let cachedDatasetPromise: Promise<DatasetCache> | null = null;

const analyticsCacheRedisKey = "dashboard:analytics";
const analyticsCacheSchemaVersion = 4;
const csvFilePath = path.join(process.cwd(), "biblio_datos_limpios.csv");
const dataSource = process.env.DATA_SOURCE === "sql" ? "sql" : "csv";
const filteredMetricsCacheTtlSeconds = 900;

export async function getDashboardAnalytics(
  filters: DashboardQueryFilters = emptyDashboardQueryFilters
): Promise<DashboardAnalytics> {
  if (dataSource === "sql") {
    return getDashboardAnalyticsFromSql(filters);
  }

  if (!hasActiveDashboardFilters(filters)) {
    return getBaseDashboardAnalytics();
  }

  const [baseDashboardAnalytics, datasetCache] = await Promise.all([
    getBaseDashboardAnalytics(),
    getDatasetCache()
  ]);

  const filteredRecords = datasetCache.records.filter((record) =>
    matchesDashboardFilters(record, filters)
  );

  return aggregateDashboardAnalytics(filteredRecords, baseDashboardAnalytics.filterOptions);
}

async function getDashboardAnalyticsFromSql(filters: DashboardQueryFilters): Promise<DashboardAnalytics> {
  const baseDashboardAnalytics = await getBaseDashboardAnalyticsSql();

  if (!hasActiveDashboardFilters(filters)) {
    return baseDashboardAnalytics;
  }

  return buildDashboardAnalyticsFromSql(filters, baseDashboardAnalytics.filterOptions);
}

async function getBaseDashboardAnalyticsSql(): Promise<DashboardAnalytics> {
  if (!cachedBaseAnalyticsPromise) {
    cachedBaseAnalyticsPromise = buildBaseDashboardAnalyticsSql().catch((error) => {
      cachedBaseAnalyticsPromise = null;
      throw error;
    });
  }

  return cachedBaseAnalyticsPromise;
}

async function buildBaseDashboardAnalyticsSql(): Promise<DashboardAnalytics> {
  const [currentDatasetVersion, cachedAnalytics] = await Promise.all([
    getCurrentDatasetVersion(),
    readAnalyticsFromPersistentCache()
  ]);

  if (
    cachedAnalytics &&
    cachedAnalytics.cacheSchemaVersion === analyticsCacheSchemaVersion &&
    cachedAnalytics.datasetVersion === currentDatasetVersion &&
    isDashboardAnalyticsCacheComplete(cachedAnalytics.dashboardAnalytics)
  ) {
    return cachedAnalytics.dashboardAnalytics;
  }

  const dashboardAnalytics = await buildDashboardAnalyticsFromSql(emptyDashboardQueryFilters);
  await writeAnalyticsToPersistentCache(currentDatasetVersion, dashboardAnalytics);

  return dashboardAnalytics;
}

async function buildDashboardAnalyticsFromSql(
  filters: DashboardQueryFilters,
  sharedFilterOptions?: DashboardFilterOptions
): Promise<DashboardAnalytics> {
  const [filterOptions, summary, resources, users, trends, searches, monitoring] = await Promise.all([
    sharedFilterOptions ? Promise.resolve(sharedFilterOptions) : getFilterOptionsFromSql(),
    getSummaryMetricsFromSql(filters),
    getResourcesMetricsFromSql(filters),
    getUsersMetricsFromSql(filters),
    getTrendsMetricsFromSql(filters),
    getSearchesMetricsFromSql(filters),
    getMonitoringMetricsFromSql(filters)
  ]);

  return {
    filterOptions,
    summaryKpis: summary.summaryKpis,
    monthlyUsageTrend: summary.monthlyUsageTrend,
    usageByCampus: summary.usageByCampus,
    usageByRole: summary.usageByRole,
    topResources: resources.topResources,
    leastUsedResources: resources.leastUsedResources,
    resourceUsageByPrimaryRoles: resources.resourceUsageByPrimaryRoles,
    resourceTypeDistribution: resources.resourceTypeDistribution,
    uniqueUsersByResource: resources.uniqueUsersByResource,
    usageByAcademicUnit: users.usageByAcademicUnit,
    usageByProgram: users.usageByProgram,
    usersVsEventsByAcademicUnit: users.usersVsEventsByAcademicUnit,
    dailyPeakUsage: trends.dailyPeakUsage,
    operationTrend: trends.operationTrend,
    operationTrendByYear: trends.operationTrendByYear,
    topSearchTerms: searches.topSearchTerms,
    searchVolumeByCampus: searches.searchVolumeByCampus,
    monitoringUsers: monitoring.monitoringUsers
  };
}

async function getSqlFilterOptions(): Promise<DashboardFilterOptions> {
  return (await getBaseDashboardAnalyticsSql()).filterOptions;
}

/**
 * Cache-aside con TTL para consultas SQL filtradas. A diferencia de la cache
 * base (invalidada con precisión contra ETL_Control_Carga), acá no vale la
 * pena rastrear la versión exacta del dataset para cada combinación posible
 * de filtros -- son demasiadas. Con un TTL simple, la combinación de filtros
 * que alguien ya consultó responde instantáneo durante los próximos minutos
 * (útil si varias personas miran el mismo año/sede), a costa de que ese
 * resultado pueda quedar unos minutos desactualizado tras una carga del ETL.
 * Si Redis falla, se sigue de largo con la consulta en vivo (best-effort).
 */
async function getCachedFilteredMetrics<TMetrics>(
  groupName: string,
  filters: DashboardQueryFilters,
  compute: () => Promise<TMetrics>
): Promise<TMetrics> {
  const cacheKey = buildFilteredMetricsCacheKey(groupName, filters);

  try {
    const cachedValue = await getRedisClient().get(cacheKey);
    if (cachedValue) {
      return JSON.parse(cachedValue) as TMetrics;
    }
  } catch {
    // seguimos con la consulta en vivo si Redis no responde
  }

  const metrics = await compute();

  try {
    await getRedisClient().set(cacheKey, JSON.stringify(metrics), "EX", filteredMetricsCacheTtlSeconds);
  } catch {
    // cache best-effort: si falla el SET, la respuesta ya se calculó igual
  }

  return metrics;
}

function buildFilteredMetricsCacheKey(groupName: string, filters: DashboardQueryFilters): string {
  const normalizedFilters = Object.fromEntries(
    (Object.keys(filters) as Array<keyof DashboardQueryFilters>)
      .sort()
      .map((key) => [key, [...filters[key]].sort()])
  );

  return `dashboard:filtered:${groupName}:${JSON.stringify(normalizedFilters)}`;
}

/**
 * Una función por endpoint. En modo SQL:
 * - Sin filtros activos (el caso común al navegar entre secciones): reusa
 *   el DashboardAnalytics base ya cacheado (Redis + memoria), sin tocar SQL.
 * - Con filtros activos: usa la cache de filtros (TTL) o, si no está, consulta
 *   en vivo solo el grupo de métricas que la ruta necesita -- eso fue lo que
 *   hacía /api/dashboard/summary tardar 35s trayendo también seguimiento y
 *   búsquedas sin usarlas.
 * En modo CSV, agregar todo sigue siendo barato (loop en memoria), así que
 * se reutiliza getDashboardAnalytics tal cual en ambos casos.
 */
export async function getFiltersDashboardData(): Promise<FiltersApiResponse> {
  if (dataSource === "sql") {
    return { filterOptions: await getSqlFilterOptions() };
  }

  return selectFiltersResponse(await getDashboardAnalytics());
}

export async function getSummaryDashboardData(filters: DashboardQueryFilters): Promise<SummaryApiResponse> {
  if (dataSource === "sql") {
    if (!hasActiveDashboardFilters(filters)) {
      return selectSummaryResponse(await getBaseDashboardAnalyticsSql());
    }

    const [filterOptions, summary] = await Promise.all([
      getSqlFilterOptions(),
      getCachedFilteredMetrics("summary", filters, () => getSummaryMetricsFromSql(filters))
    ]);
    return { filterOptions, ...summary };
  }

  return selectSummaryResponse(await getDashboardAnalytics(filters));
}

export async function getResourcesDashboardData(filters: DashboardQueryFilters): Promise<ResourcesApiResponse> {
  if (dataSource === "sql") {
    if (!hasActiveDashboardFilters(filters)) {
      return selectResourcesResponse(await getBaseDashboardAnalyticsSql());
    }

    const [filterOptions, resources] = await Promise.all([
      getSqlFilterOptions(),
      getCachedFilteredMetrics("resources", filters, () => getResourcesMetricsFromSql(filters))
    ]);
    return { filterOptions, ...resources };
  }

  return selectResourcesResponse(await getDashboardAnalytics(filters));
}

export async function getUsersDashboardData(filters: DashboardQueryFilters): Promise<UsersApiResponse> {
  if (dataSource === "sql") {
    if (!hasActiveDashboardFilters(filters)) {
      return selectUsersResponse(await getBaseDashboardAnalyticsSql());
    }

    const [filterOptions, users] = await Promise.all([
      getSqlFilterOptions(),
      getCachedFilteredMetrics("users", filters, () => getUsersMetricsFromSql(filters))
    ]);
    return { filterOptions, ...users };
  }

  return selectUsersResponse(await getDashboardAnalytics(filters));
}

export async function getTrendsDashboardData(filters: DashboardQueryFilters): Promise<TrendsApiResponse> {
  if (dataSource === "sql") {
    if (!hasActiveDashboardFilters(filters)) {
      return selectTrendsResponse(await getBaseDashboardAnalyticsSql());
    }

    const [filterOptions, combinedTrends] = await Promise.all([
      getSqlFilterOptions(),
      getCachedFilteredMetrics("trends", filters, async () => {
        const [monthlyUsageTrend, trends] = await Promise.all([
          getMonthlyUsageTrendFromSql(filters),
          getTrendsMetricsFromSql(filters)
        ]);
        return { monthlyUsageTrend, ...trends };
      })
    ]);
    return { filterOptions, ...combinedTrends };
  }

  return selectTrendsResponse(await getDashboardAnalytics(filters));
}

export async function getSearchesDashboardData(filters: DashboardQueryFilters): Promise<SearchesApiResponse> {
  if (dataSource === "sql") {
    if (!hasActiveDashboardFilters(filters)) {
      return selectSearchesResponse(await getBaseDashboardAnalyticsSql());
    }

    const [filterOptions, searches] = await Promise.all([
      getSqlFilterOptions(),
      getCachedFilteredMetrics("searches", filters, () => getSearchesMetricsFromSql(filters))
    ]);
    return { filterOptions, ...searches };
  }

  return selectSearchesResponse(await getDashboardAnalytics(filters));
}

export async function getMonitoringDashboardData(filters: DashboardQueryFilters): Promise<MonitoringApiResponse> {
  if (dataSource === "sql") {
    if (!hasActiveDashboardFilters(filters)) {
      return selectMonitoringResponse(await getBaseDashboardAnalyticsSql());
    }

    const [filterOptions, monitoring] = await Promise.all([
      getSqlFilterOptions(),
      getCachedFilteredMetrics("monitoring", filters, () => getMonitoringMetricsFromSql(filters))
    ]);
    return { filterOptions, ...monitoring };
  }

  return selectMonitoringResponse(await getDashboardAnalytics(filters));
}

async function getBaseDashboardAnalytics(): Promise<DashboardAnalytics> {
  if (!cachedBaseAnalyticsPromise) {
    cachedBaseAnalyticsPromise = buildBaseDashboardAnalytics().catch((error) => {
      cachedBaseAnalyticsPromise = null;
      throw error;
    });
  }

  return cachedBaseAnalyticsPromise;
}

async function buildBaseDashboardAnalytics(): Promise<DashboardAnalytics> {
  const [datasetCache, cachedAnalytics] = await Promise.all([
    getDatasetCache(),
    readAnalyticsFromPersistentCache()
  ]);

  if (
    cachedAnalytics &&
    cachedAnalytics.cacheSchemaVersion === analyticsCacheSchemaVersion &&
    cachedAnalytics.datasetVersion === datasetCache.datasetVersion &&
    isDashboardAnalyticsCacheComplete(cachedAnalytics.dashboardAnalytics)
  ) {
    return cachedAnalytics.dashboardAnalytics;
  }

  const dashboardAnalytics = aggregateDashboardAnalytics(datasetCache.records);
  await writeAnalyticsToPersistentCache(datasetCache.datasetVersion, dashboardAnalytics);

  return dashboardAnalytics;
}

async function getDatasetCache(): Promise<DatasetCache> {
  const currentDatasetVersion = await getCurrentDatasetVersion();

  if (!cachedDatasetPromise) {
    cachedDatasetPromise = buildDatasetCache(currentDatasetVersion).catch((error) => {
      cachedDatasetPromise = null;
      throw error;
    });
    return cachedDatasetPromise;
  }

  const cachedDataset = await cachedDatasetPromise;

  if (cachedDataset.datasetVersion === currentDatasetVersion) {
    return cachedDataset;
  }

  cachedDatasetPromise = buildDatasetCache(currentDatasetVersion).catch((error) => {
    cachedDatasetPromise = null;
    throw error;
  });

  return cachedDatasetPromise;
}

async function getCurrentDatasetVersion(): Promise<string> {
  if (dataSource === "sql") {
    const pool = await getSqlPool();
    const result = await pool
      .request()
      .query(
        `SELECT CONVERT(varchar(33), MAX(fecha_fin_ejecucion), 126) AS lastLoadTimestamp
         FROM dbbibliotecas.ETL_Control_Carga
         WHERE estado = 'OK'`
      );

    const lastLoadTimestamp = result.recordset[0]?.lastLoadTimestamp;
    return lastLoadTimestamp ? String(lastLoadTimestamp) : "sin-carga-etl";
  }

  const csvFileStats = await stat(csvFilePath);
  return String(csvFileStats.mtimeMs);
}

async function buildDatasetCache(datasetVersion: string): Promise<DatasetCache> {
  const records = await readCsvRecords(csvFilePath);

  return {
    datasetVersion,
    records
  };
}

function aggregateDashboardAnalytics(
  records: LibraryUsageRecord[],
  sharedFilterOptions?: DashboardFilterOptions
): DashboardAnalytics {
  const totalEventCounter = { value: 0 };
  const totalSearchCounter = { value: 0 };
  const totalUrlCounter = { value: 0 };

  const uniqueUsers = new Set<string>();
  const yearOptions = new Set<string>();
  const monthOptions = new Set<string>();
  const campusOptions = new Set<string>();
  const academicUnitOptions = new Set<string>();
  const programOptions = new Set<string>();
  const modalityOptions = new Set<string>();
  const accessTypeOptions = new Set<string>();
  const roleOptions = new Set<string>();
  const resourceOptions = new Set<string>();
  const resourceTypeOptions = new Set<string>();

  const usageByCampus = new Map<string, number>();
  const usageByRole = new Map<string, number>();
  const topResources = new Map<string, number>();
  const resourceTypeDistribution = new Map<string, number>();
  const usageByAcademicUnit = new Map<string, number>();
  const usageByProgram = new Map<string, number>();
  const monthlyUsageTrend = new Map<string, number>();
  const dailyPeakUsage = new Map<string, number>();
  const searchTerms = new Map<string, number>();
  const searchVolumeByCampus = new Map<string, number>();

  const operationTrendByMonth = new Map<string, OperationTrendMetric>();
  const operationTrendByYear = new Map<string, OperationYearMetric>();
  const uniqueUsersByResource = new Map<string, Set<string>>();
  const uniqueUsersByAcademicUnit = new Map<string, Set<string>>();
  const resourceUsageByRole = new Map<string, ResourceUsageByRoleMetric>();
  const userAccumulators = new Map<string, UserAccumulator>();

  for (const record of records) {
    totalEventCounter.value += 1;

    const identification = record.identificacion;
    const fullName = record.nombre;
    const role = record.cargo;
    const academicUnit = record.ua;
    const program = record.carrera;
    const modality = record.modalidad;
    const accessType = record.tipoAcceso;
    const campus = record.sede;
    const operation = record.operacion;
    const searchTerm = record.busqueda;
    const resource = record.recurso;
    const resourceType = record.tipoRecurso;
    const year = record.anio;
    const monthKey = year && record.mes ? `${year}-${record.mes}` : "SIN FECHA";

    if (identification) {
      uniqueUsers.add(identification);
    }

    addOption(yearOptions, year);
    addOption(monthOptions, record.monthLabel);
    addOption(campusOptions, campus);
    addOption(academicUnitOptions, academicUnit);
    addOption(programOptions, program);
    addOption(modalityOptions, modality);
    addOption(accessTypeOptions, accessType);
    addOption(roleOptions, role);
    addOption(resourceOptions, resource);
    addOption(resourceTypeOptions, resourceType);

    incrementMapCounter(dailyPeakUsage, record.fecha);

    const operationTrend = operationTrendByMonth.get(monthKey) ?? {
      month: monthKey,
      url: 0,
      loginSuccess: 0,
      search: 0
    };

    const operationYearTrend = operationTrendByYear.get(year) ?? {
      year,
      url: 0,
      loginSuccess: 0,
      search: 0
    };

    if (operation === "URL") {
      totalUrlCounter.value += 1;
      incrementMapCounter(monthlyUsageTrend, monthKey);
      incrementMapCounter(usageByCampus, campus);
      incrementMapCounter(usageByRole, role);
      incrementMapCounter(usageByAcademicUnit, academicUnit);
      incrementMapCounter(usageByProgram, program);
      incrementMapCounter(topResources, resource);
      incrementMapCounter(resourceTypeDistribution, resourceType);
      addToSetMap(uniqueUsersByResource, resource, identification);
      addToSetMap(uniqueUsersByAcademicUnit, academicUnit, identification);
      accumulateResourceUsageByPrimaryRole(resourceUsageByRole, resource, role);
      operationTrend.url += 1;
      operationYearTrend.url += 1;
    }

    if (operation === "SEARCH") {
      totalSearchCounter.value += 1;
      operationTrend.search += 1;
      operationYearTrend.search += 1;
      incrementMapCounter(searchVolumeByCampus, campus);

      const normalizedSearchTerm = normalizeSearchTerm(searchTerm);
      if (normalizedSearchTerm) {
        incrementMapCounter(searchTerms, normalizedSearchTerm);
      }
    }

    if (operation === "LOGIN-SUCCESS") {
      operationTrend.loginSuccess += 1;
      operationYearTrend.loginSuccess += 1;
    }

    operationTrendByMonth.set(monthKey, operationTrend);
    operationTrendByYear.set(year, operationYearTrend);

    if (identification) {
      accumulateUserUsage(userAccumulators, {
        identification,
        fullName,
        role,
        academicUnit,
        program,
        campus,
        operation,
        date: record.fecha
      });
    }
  }

  const filterOptions =
    sharedFilterOptions ??
    {
      years: sortLexicographically([...yearOptions]),
      months: sortLexicographically([...monthOptions]),
      campuses: sortMapLabelsAlphabetically(usageByCampus),
      academicUnits: sortMapLabelsAlphabetically(usageByAcademicUnit),
      programs: sortMapLabelsAlphabetically(usageByProgram),
      modalities: sortLexicographically([...modalityOptions]),
      accessTypes: sortLexicographically([...accessTypeOptions]).filter(
        (accessType) => accessType !== "SIN TIPO DE ACCESO"
      ),
      roles: sortMapLabelsAlphabetically(usageByRole),
      resources: sortMapLabelsAlphabetically(topResources),
      resourceTypes: sortMapLabelsAlphabetically(resourceTypeDistribution),
      users: buildUserOptions(userAccumulators)
    };

  return {
    filterOptions,
    summaryKpis: buildSummaryKpis(
      totalEventCounter.value,
      uniqueUsers.size,
      totalSearchCounter.value,
      totalUrlCounter.value
    ),
    monthlyUsageTrend: sortMonthlyMetrics(monthlyUsageTrend),
    usageByCampus: takeTop(sortByCountThenLabel(usageByCampus), 10),
    usageByRole: takeTop(sortByCountThenLabel(usageByRole), 10),
    topResources: takeTop(sortByCountThenLabel(topResources), 10),
    leastUsedResources: takeBottom(sortByCountThenLabel(topResources), 10),
    resourceUsageByPrimaryRoles: buildResourceUsageByPrimaryRoles(resourceUsageByRole),
    resourceTypeDistribution: takeTop(sortByCountThenLabel(resourceTypeDistribution), 10),
    uniqueUsersByResource: takeTop(buildUniqueUserMetrics(uniqueUsersByResource), 10),
    usageByAcademicUnit: takeTop(sortByCountThenLabel(usageByAcademicUnit), 10),
    usageByProgram: takeTop(sortByCountThenLabel(usageByProgram), 10),
    usersVsEventsByAcademicUnit: buildAcademicUnitScatterMetrics(
      usageByAcademicUnit,
      uniqueUsersByAcademicUnit
    ),
    dailyPeakUsage: takeTop(sortByCountThenLabel(dailyPeakUsage), 10),
    operationTrend: sortOperationTrendMetrics(operationTrendByMonth),
    operationTrendByYear: sortOperationYearMetrics(operationTrendByYear),
    topSearchTerms: takeTop(sortByCountThenLabel(searchTerms), 10),
    searchVolumeByCampus: takeTop(sortByCountThenLabel(searchVolumeByCampus), 10),
    monitoringUsers: buildMonitoringUsers(userAccumulators)
  };
}

function matchesDashboardFilters(
  record: LibraryUsageRecord,
  filters: DashboardQueryFilters
): boolean {
  return (
    matchesFilterValues(record.anio, filters.years) &&
    matchesFilterValues(record.monthLabel, filters.months) &&
    matchesFilterValues(record.sede, filters.campuses) &&
    matchesFilterValues(record.ua, filters.academicUnits) &&
    matchesFilterValues(record.carrera, filters.programs) &&
    matchesFilterValues(record.modalidad, filters.modalities) &&
    matchesFilterValues(record.tipoAcceso, filters.accessTypes) &&
    matchesFilterValues(record.cargo, filters.roles) &&
    matchesFilterValues(record.recurso, filters.resources) &&
    matchesFilterValues(record.tipoRecurso, filters.resourceTypes) &&
    matchesFilterValues(record.userLabel, filters.users)
  );
}

function matchesFilterValues(value: string, selectedValues: string[]): boolean {
  return selectedValues.length === 0 || selectedValues.includes(value);
}

async function readCsvRecords(filePath: string): Promise<LibraryUsageRecord[]> {
  const fileContent = await readFile(filePath, "utf-8");
  const rawLines = fileContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (rawLines.length === 0) {
    return [];
  }

  const headerColumns = splitDelimitedLine(rawLines[0], ";").map((column, index) =>
    index === 0 ? column.replace(/^\uFEFF/, "") : column
  );

  return rawLines.slice(1).map((rawLine) => {
    const columns = splitDelimitedLine(rawLine, ";");
    const recordByHeader = Object.fromEntries(
      headerColumns.map((columnName, index) => [columnName, columns[index] ?? ""])
    );

    return buildLibraryUsageRecordFromRawFields(recordByHeader);
  });
}

function buildLibraryUsageRecordFromRawFields(recordByHeader: Record<string, string>): LibraryUsageRecord {
  const year = sanitizeField(recordByHeader.anio ?? "");
  const month = sanitizeMonth(recordByHeader.mes ?? "");
  const monthLabel = monthLabelByNumber.get(month) ?? "";
  const identification = sanitizeField(recordByHeader.identificacion ?? "");
  const fullName = sanitizeField(recordByHeader.nombre ?? "");

  return {
    fecha: sanitizeField(recordByHeader.fecha ?? ""),
    identificacion: identification,
    nombre: fullName,
    cargo: sanitizeField(recordByHeader.cargo ?? "", "SIN CARGO"),
    carrera: sanitizeField(recordByHeader.carrera ?? "", "SIN CARRERA"),
    modalidad: sanitizeField(recordByHeader.modalidad ?? "", "SIN MODALIDAD"),
    tipoAcceso: sanitizeField(recordByHeader.tipo_acceso ?? "", "SIN TIPO DE ACCESO"),
    ua: sanitizeField(recordByHeader.ua ?? "", "SIN UNIDAD ACADEMICA"),
    sede: sanitizeField(recordByHeader.sede ?? "", "SIN SEDE"),
    operacion: sanitizeField(recordByHeader.operacion ?? "", "SIN OPERACION"),
    busqueda: sanitizeField(recordByHeader.busqueda ?? ""),
    recurso: sanitizeField(recordByHeader.recurso ?? "", "SIN RECURSO"),
    tipoRecurso: sanitizeField(recordByHeader.tiporecurso ?? "", "SIN TIPO DE RECURSO"),
    anio: year,
    mes: month,
    monthLabel,
    userLabel: identification && fullName ? `${identification} - ${fullName}` : identification
  };
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const currentCharacter = line[index];

    if (currentCharacter === "\"") {
      const nextCharacter = line[index + 1];

      if (insideQuotes && nextCharacter === "\"") {
        currentValue += "\"";
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (currentCharacter === delimiter && !insideQuotes) {
      values.push(currentValue);
      currentValue = "";
      continue;
    }

    currentValue += currentCharacter;
  }

  values.push(currentValue);
  return values;
}

function sanitizeField(value: string, fallbackValue = ""): string {
  const trimmedValue = value.trim();
  return trimmedValue || fallbackValue;
}

function sanitizeMonth(month: string): string {
  const trimmedMonth = month.trim();

  if (!trimmedMonth) {
    return "";
  }

  return trimmedMonth.padStart(2, "0");
}

function normalizeSearchTerm(searchTerm: string): string {
  const sanitizedSearchTerm = sanitizeField(searchTerm);

  if (!sanitizedSearchTerm) {
    return "";
  }

  return sanitizedSearchTerm.toLowerCase();
}

function buildMonitoringUsers(userAccumulators: Map<string, UserAccumulator>): UserMonitoringRow[] {
  return [...userAccumulators.values()]
    .sort((leftUser, rightUser) => rightUser.totalEvents - leftUser.totalEvents)
    .slice(0, 100)
    .map((user) => ({
      identification: user.identification,
      fullName: user.fullName,
      role: user.role,
      academicUnit: user.academicUnit,
      program: user.program,
      campus: user.campus,
      totalEvents: user.totalEvents,
      totalSearches: user.totalSearches,
      totalResourceAccesses: user.totalResourceAccesses,
      firstUsageDate: user.firstUsageDate,
      lastUsageDate: user.lastUsageDate
    }));
}

function buildUserOptions(userAccumulators: Map<string, UserAccumulator>): string[] {
  return [...userAccumulators.values()]
    .sort((leftUser, rightUser) => leftUser.fullName.localeCompare(rightUser.fullName, "es"))
    .slice(0, 300)
    .map((user) => `${user.identification} - ${user.fullName}`);
}

function accumulateUserUsage(
  userAccumulators: Map<string, UserAccumulator>,
  userEvent: {
    identification: string;
    fullName: string;
    role: string;
    academicUnit: string;
    program: string;
    campus: string;
    operation: string;
    date: string;
  }
): void {
  const existingAccumulator = userAccumulators.get(userEvent.identification) ?? {
    identification: userEvent.identification,
    fullName: userEvent.fullName,
    role: userEvent.role,
    academicUnit: userEvent.academicUnit,
    program: userEvent.program,
    campus: userEvent.campus,
    totalEvents: 0,
    totalSearches: 0,
    totalResourceAccesses: 0,
    firstUsageDate: userEvent.date,
    lastUsageDate: userEvent.date
  };

  existingAccumulator.totalEvents += 1;

  if (userEvent.operation === "SEARCH") {
    existingAccumulator.totalSearches += 1;
  }

  if (userEvent.operation === "URL") {
    existingAccumulator.totalResourceAccesses += 1;
  }

  if (userEvent.date < existingAccumulator.firstUsageDate) {
    existingAccumulator.firstUsageDate = userEvent.date;
  }

  if (userEvent.date > existingAccumulator.lastUsageDate) {
    existingAccumulator.lastUsageDate = userEvent.date;
  }

  userAccumulators.set(userEvent.identification, existingAccumulator);
}

async function readAnalyticsFromPersistentCache(): Promise<{
  cacheSchemaVersion: number;
  datasetVersion: string;
  dashboardAnalytics: DashboardAnalytics;
} | null> {
  try {
    const cachedValue = await getRedisClient().get(analyticsCacheRedisKey);

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue) as {
      cacheSchemaVersion: number;
      datasetVersion: string;
      dashboardAnalytics: DashboardAnalytics;
    };
  } catch {
    return null;
  }
}

async function writeAnalyticsToPersistentCache(
  datasetVersion: string,
  dashboardAnalytics: DashboardAnalytics
): Promise<void> {
  await getRedisClient().set(
    analyticsCacheRedisKey,
    JSON.stringify({
      cacheSchemaVersion: analyticsCacheSchemaVersion,
      datasetVersion,
      dashboardAnalytics
    })
  );
}

function isDashboardAnalyticsCacheComplete(
  dashboardAnalytics: DashboardAnalytics
): boolean {
  return (
    Array.isArray(dashboardAnalytics.topResources) &&
    Array.isArray(dashboardAnalytics.leastUsedResources) &&
    Array.isArray(dashboardAnalytics.resourceUsageByPrimaryRoles) &&
    Array.isArray(dashboardAnalytics.operationTrendByYear)
  );
}
