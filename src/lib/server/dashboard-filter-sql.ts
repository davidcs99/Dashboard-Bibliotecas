import type sql from "mssql";
import type { DashboardQueryFilters } from "@/types/dashboard";

const filteredColumnByKey: Record<
  Exclude<keyof DashboardQueryFilters, "months" | "users">,
  string
> = {
  years: "anio",
  campuses: "sede",
  academicUnits: "ua",
  programs: "carrera",
  modalities: "modalidad",
  accessTypes: "tipoAcceso",
  roles: "cargo",
  resources: "recurso",
  resourceTypes: "tipoRecurso"
};

/**
 * Mismos valores de reemplazo que aplica sanitizeField() en el camino CSV
 * (dashboard-analytics-service.ts) cuando el dato viene vacío. La vista SQL
 * puede traer NULL en estas columnas (JOIN a dimensión sin match, o dato
 * vacío en origen); se usa COALESCE tanto al agrupar como al filtrar para
 * que un valor "SIN X" se comporte igual en ambos caminos.
 */
export const fallbackTextByColumn: Record<string, string> = {
  cargo: "SIN CARGO",
  carrera: "SIN CARRERA",
  modalidad: "SIN MODALIDAD",
  tipoAcceso: "SIN TIPO DE ACCESO",
  ua: "SIN UNIDAD ACADEMICA",
  sede: "SIN SEDE",
  recurso: "SIN RECURSO",
  tipoRecurso: "SIN TIPO DE RECURSO"
};

export function withFallback(column: string): string {
  const fallbackText = fallbackTextByColumn[column];
  return fallbackText ? `COALESCE(${column}, '${fallbackText}')` : column;
}

/**
 * Traduce DashboardQueryFilters a un WHERE parametrizado contra las columnas
 * de dbbibliotecas.v_uso_biblioteca. Todos los valores viajan como parámetros
 * (request.input) porque vienen de query params controlados por el usuario.
 */
export function buildFilterWhereClause(request: sql.Request, filters: DashboardQueryFilters): string {
  const conditions: string[] = [];
  let paramIndex = 0;

  function addInCondition(column: string, values: Array<string | number>): void {
    if (values.length === 0) {
      return;
    }

    const paramNames = values.map((value) => {
      const paramName = `p${paramIndex}`;
      paramIndex += 1;
      request.input(paramName, value);
      return `@${paramName}`;
    });

    conditions.push(`${withFallback(column)} IN (${paramNames.join(", ")})`);
  }

  for (const [filterKey, column] of Object.entries(filteredColumnByKey) as Array<
    [keyof typeof filteredColumnByKey, string]
  >) {
    addInCondition(column, filters[filterKey]);
  }

  const monthNumbers = filters.months
    .map((monthLabel) => Number(monthLabel.slice(0, 2)))
    .filter((monthNumber) => Number.isInteger(monthNumber));
  addInCondition("mes", monthNumbers);

  const identifications = filters.users
    .map((userLabel) => userLabel.split(" - ")[0]?.trim())
    .filter((value): value is string => Boolean(value));
  addInCondition("identificacion", identifications);

  return conditions.length > 0 ? conditions.join(" AND ") : "1 = 1";
}
