import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { emptyDashboardQueryFilters, hasActiveDashboardFilters } from "@/lib/dashboard-filters";
import { formatDecimal, formatInteger } from "@/lib/utils/formatters";
import type {
  CategoryMetric,
  DashboardAnalytics,
  DashboardFilterOptions,
  DashboardQueryFilters,
  KpiMetric,
  MonthlyMetric,
  OperationYearMetric,
  OperationTrendMetric,
  ResourceUsageByRoleMetric,
  ScatterMetric,
  UserMonitoringRow
} from "@/types/dashboard";

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
  csvLastModifiedTimeMs: number;
  records: LibraryUsageRecord[];
};

let cachedBaseAnalyticsPromise: Promise<DashboardAnalytics> | null = null;
let cachedDatasetPromise: Promise<DatasetCache> | null = null;

const analyticsCacheDirectoryPath = path.join(process.cwd(), ".cache");
const analyticsCacheFilePath = path.join(analyticsCacheDirectoryPath, "dashboard-analytics.json");
const analyticsCacheSchemaVersion = 3;
const csvFilePath = path.join(process.cwd(), "biblio_datos_limpios.csv");

const monthLabelByNumber = new Map<string, string>([
  ["01", "01 - ENERO"],
  ["02", "02 - FEBRERO"],
  ["03", "03 - MARZO"],
  ["04", "04 - ABRIL"],
  ["05", "05 - MAYO"],
  ["06", "06 - JUNIO"],
  ["07", "07 - JULIO"],
  ["08", "08 - AGOSTO"],
  ["09", "09 - SEPTIEMBRE"],
  ["10", "10 - OCTUBRE"],
  ["11", "11 - NOVIEMBRE"],
  ["12", "12 - DICIEMBRE"]
]);

export async function getDashboardAnalytics(
  filters: DashboardQueryFilters = emptyDashboardQueryFilters
): Promise<DashboardAnalytics> {
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
  await access(csvFilePath);
  const [datasetCache, cachedAnalytics] = await Promise.all([
    getDatasetCache(),
    readAnalyticsFromPersistentCache()
  ]);

  if (
    cachedAnalytics &&
    cachedAnalytics.cacheSchemaVersion === analyticsCacheSchemaVersion &&
    cachedAnalytics.csvLastModifiedTimeMs === datasetCache.csvLastModifiedTimeMs &&
    isDashboardAnalyticsCacheComplete(cachedAnalytics.dashboardAnalytics)
  ) {
    return cachedAnalytics.dashboardAnalytics;
  }

  const dashboardAnalytics = aggregateDashboardAnalytics(datasetCache.records);
  await writeAnalyticsToPersistentCache(datasetCache.csvLastModifiedTimeMs, dashboardAnalytics);

  return dashboardAnalytics;
}

async function getDatasetCache(): Promise<DatasetCache> {
  const csvFileStats = await stat(csvFilePath);

  if (!cachedDatasetPromise) {
    cachedDatasetPromise = buildDatasetCache(csvFileStats.mtimeMs).catch((error) => {
      cachedDatasetPromise = null;
      throw error;
    });
    return cachedDatasetPromise;
  }

  const cachedDataset = await cachedDatasetPromise;

  if (cachedDataset.csvLastModifiedTimeMs === csvFileStats.mtimeMs) {
    return cachedDataset;
  }

  cachedDatasetPromise = buildDatasetCache(csvFileStats.mtimeMs).catch((error) => {
    cachedDatasetPromise = null;
    throw error;
  });

  return cachedDatasetPromise;
}

async function buildDatasetCache(csvLastModifiedTimeMs: number): Promise<DatasetCache> {
  const records = await readCsvRecords(csvFilePath);

  return {
    csvLastModifiedTimeMs,
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

function buildSummaryKpis(
  totalEvents: number,
  uniqueUsersCount: number,
  totalSearches: number,
  totalResourceAccesses: number
): KpiMetric[] {
  const averageEventsPerUser = uniqueUsersCount === 0 ? 0 : totalEvents / uniqueUsersCount;

  return [
    {
      label: "Total de interacciones con las bibliotecas",
      value: formatInteger(totalEvents),
      supportingText: "Interacción de los usuarios con las bibliotecas digitales."
    },
    {
      label: "Usuarios unicos",
      value: formatInteger(uniqueUsersCount),
      supportingText: "Personas diferentes con actividad registrada"
    },
    {
      label: "Total de busquedas",
      value: formatInteger(totalSearches),
      supportingText: "Consultas realizadas dentro del ecosistema digital"
    },
    {
      label: "Promedio de eventos por usuario",
      value: formatDecimal(averageEventsPerUser),
      supportingText: "Mide la intensidad general de uso"
    },
    {
      label: "Total de accesos a bibliotecas",
      value: formatInteger(totalResourceAccesses),
      supportingText: "Consultas efectivas realizadas mediante URL"
    }
  ];
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
  });
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

function incrementMapCounter(counterMap: Map<string, number>, key: string): void {
  counterMap.set(key, (counterMap.get(key) ?? 0) + 1);
}

function addToSetMap(setMap: Map<string, Set<string>>, key: string, value: string): void {
  if (!key || !value) {
    return;
  }

  const valueSet = setMap.get(key) ?? new Set<string>();
  valueSet.add(value);
  setMap.set(key, valueSet);
}

function sortByCountThenLabel(counterMap: Map<string, number>): CategoryMetric[] {
  return [...counterMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((leftItem, rightItem) => {
      if (rightItem.value !== leftItem.value) {
        return rightItem.value - leftItem.value;
      }

      return leftItem.label.localeCompare(rightItem.label, "es");
    });
}

function sortMonthlyMetrics(counterMap: Map<string, number>): MonthlyMetric[] {
  return [...counterMap.entries()]
    .map(([month, value]) => ({ month, value }))
    .sort((leftItem, rightItem) => leftItem.month.localeCompare(rightItem.month, "es"));
}

function sortOperationTrendMetrics(counterMap: Map<string, OperationTrendMetric>): OperationTrendMetric[] {
  return [...counterMap.values()].sort((leftItem, rightItem) =>
    leftItem.month.localeCompare(rightItem.month, "es")
  );
}

function sortOperationYearMetrics(counterMap: Map<string, OperationYearMetric>): OperationYearMetric[] {
  return [...counterMap.values()].sort((leftItem, rightItem) =>
    leftItem.year.localeCompare(rightItem.year, "es")
  );
}

function buildUniqueUserMetrics(uniqueValuesMap: Map<string, Set<string>>): CategoryMetric[] {
  return [...uniqueValuesMap.entries()]
    .map(([label, values]) => ({
      label,
      value: values.size
    }))
    .sort((leftItem, rightItem) => {
      if (rightItem.value !== leftItem.value) {
        return rightItem.value - leftItem.value;
      }

      return leftItem.label.localeCompare(rightItem.label, "es");
    });
}

function buildAcademicUnitScatterMetrics(
  usageByAcademicUnit: Map<string, number>,
  uniqueUsersByAcademicUnit: Map<string, Set<string>>
): ScatterMetric[] {
  return [...usageByAcademicUnit.entries()]
    .map(([academicUnit, eventCount]) => ({
      name: academicUnit,
      events: eventCount,
      users: (uniqueUsersByAcademicUnit.get(academicUnit) ?? new Set<string>()).size
    }))
    .sort((leftItem, rightItem) => rightItem.events - leftItem.events)
    .slice(0, 12);
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

function buildResourceUsageByPrimaryRoles(
  resourceUsageByRole: Map<string, ResourceUsageByRoleMetric>
): ResourceUsageByRoleMetric[] {
  return [...resourceUsageByRole.values()]
    .sort((leftItem, rightItem) => {
      const leftTotal = leftItem.student + leftItem.teacher;
      const rightTotal = rightItem.student + rightItem.teacher;

      if (rightTotal !== leftTotal) {
        return rightTotal - leftTotal;
      }

      return leftItem.resource.localeCompare(rightItem.resource, "es");
    })
    .slice(0, 10);
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

function takeTop<TItem>(items: TItem[], topCount: number): TItem[] {
  return items.slice(0, topCount);
}

function takeBottom<TItem extends CategoryMetric>(items: TItem[], bottomCount: number): TItem[] {
  return [...items]
    .filter((item) => item.label !== "SIN RECURSO")
    .reverse()
    .slice(0, bottomCount)
    .reverse();
}

function sortLexicographically(values: string[]): string[] {
  return [...values].sort((leftValue, rightValue) => leftValue.localeCompare(rightValue, "es"));
}

function sortMapLabelsAlphabetically(counterMap: Map<string, number>): string[] {
  return sortLexicographically([...counterMap.keys()]);
}

function addOption(optionSet: Set<string>, value: string): void {
  if (value) {
    optionSet.add(value);
  }
}

function accumulateResourceUsageByPrimaryRole(
  resourceUsageByRole: Map<string, ResourceUsageByRoleMetric>,
  resource: string,
  role: string
): void {
  if (!resource || resource === "SIN RECURSO") {
    return;
  }

  if (role !== "ALUMNO" && role !== "DOCENTE") {
    return;
  }

  const currentMetric = resourceUsageByRole.get(resource) ?? {
    resource,
    student: 0,
    teacher: 0
  };

  if (role === "ALUMNO") {
    currentMetric.student += 1;
  }

  if (role === "DOCENTE") {
    currentMetric.teacher += 1;
  }

  resourceUsageByRole.set(resource, currentMetric);
}

async function readAnalyticsFromPersistentCache(): Promise<{
  cacheSchemaVersion: number;
  csvLastModifiedTimeMs: number;
  dashboardAnalytics: DashboardAnalytics;
} | null> {
  try {
    const cacheFileContent = await readFile(analyticsCacheFilePath, "utf-8");
    return JSON.parse(cacheFileContent) as {
      cacheSchemaVersion: number;
      csvLastModifiedTimeMs: number;
      dashboardAnalytics: DashboardAnalytics;
    };
  } catch {
    return null;
  }
}

async function writeAnalyticsToPersistentCache(
  csvLastModifiedTimeMs: number,
  dashboardAnalytics: DashboardAnalytics
): Promise<void> {
  await mkdir(analyticsCacheDirectoryPath, { recursive: true });
  await writeFile(
    analyticsCacheFilePath,
    JSON.stringify({
      cacheSchemaVersion: analyticsCacheSchemaVersion,
      csvLastModifiedTimeMs,
      dashboardAnalytics
    }),
    "utf-8"
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
