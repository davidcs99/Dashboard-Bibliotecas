import { formatDecimal, formatInteger } from "@/lib/utils/formatters";
import type {
  CategoryMetric,
  KpiMetric,
  MonthlyMetric,
  OperationTrendMetric,
  OperationYearMetric,
  ResourceUsageByRoleMetric,
  ScatterMetric
} from "@/types/dashboard";

export const monthLabelByNumber = new Map<string, string>([
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

export function incrementMapCounter(counterMap: Map<string, number>, key: string, amount = 1): void {
  if (!key) {
    return;
  }

  counterMap.set(key, (counterMap.get(key) ?? 0) + amount);
}

export function addToSetMap(setMap: Map<string, Set<string>>, key: string, value: string): void {
  if (!key || !value) {
    return;
  }

  const valueSet = setMap.get(key) ?? new Set<string>();
  valueSet.add(value);
  setMap.set(key, valueSet);
}

export function addOption(optionSet: Set<string>, value: string): void {
  if (value) {
    optionSet.add(value);
  }
}

export function sortByCountThenLabel(counterMap: Map<string, number>): CategoryMetric[] {
  return [...counterMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((leftItem, rightItem) => {
      if (rightItem.value !== leftItem.value) {
        return rightItem.value - leftItem.value;
      }

      return leftItem.label.localeCompare(rightItem.label, "es");
    });
}

export function sortMonthlyMetrics(counterMap: Map<string, number>): MonthlyMetric[] {
  return [...counterMap.entries()]
    .map(([month, value]) => ({ month, value }))
    .sort((leftItem, rightItem) => leftItem.month.localeCompare(rightItem.month, "es"));
}

export function sortOperationTrendMetrics(counterMap: Map<string, OperationTrendMetric>): OperationTrendMetric[] {
  return [...counterMap.values()].sort((leftItem, rightItem) =>
    leftItem.month.localeCompare(rightItem.month, "es")
  );
}

export function sortOperationYearMetrics(counterMap: Map<string, OperationYearMetric>): OperationYearMetric[] {
  return [...counterMap.values()].sort((leftItem, rightItem) =>
    leftItem.year.localeCompare(rightItem.year, "es")
  );
}

export function buildUniqueUserMetrics(uniqueValuesMap: Map<string, Set<string>>): CategoryMetric[] {
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

export function buildAcademicUnitScatterMetrics(
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

export function buildResourceUsageByPrimaryRoles(
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

export function accumulateResourceUsageByPrimaryRole(
  resourceUsageByRole: Map<string, ResourceUsageByRoleMetric>,
  resource: string,
  role: string,
  amount = 1
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
    currentMetric.student += amount;
  }

  if (role === "DOCENTE") {
    currentMetric.teacher += amount;
  }

  resourceUsageByRole.set(resource, currentMetric);
}

export function takeTop<TItem>(items: TItem[], topCount: number): TItem[] {
  return items.slice(0, topCount);
}

export function takeBottom<TItem extends CategoryMetric>(items: TItem[], bottomCount: number): TItem[] {
  return [...items]
    .filter((item) => item.label !== "SIN RECURSO")
    .reverse()
    .slice(0, bottomCount)
    .reverse();
}

export function sortLexicographically(values: string[]): string[] {
  return [...values].sort((leftValue, rightValue) => leftValue.localeCompare(rightValue, "es"));
}

export function sortMapLabelsAlphabetically(counterMap: Map<string, number>): string[] {
  return sortLexicographically([...counterMap.keys()]);
}

export function buildSummaryKpis(
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
