"use client";

import { Chip, Stack, Typography } from "@mui/material";
import { useDashboardQueryFilters } from "@/hooks/use-dashboard-query-filters";

const filterLabelByKey = {
  years: "Anio",
  months: "Mes",
  campuses: "Sede",
  academicUnits: "Unidad academica",
  programs: "Carrera",
  modalities: "Modalidad",
  roles: "Cargo",
  resources: "Recurso",
  resourceTypes: "Tipo de recurso",
  users: "Usuario"
} as const;

export function ActiveFiltersSummary() {
  const filters = useDashboardQueryFilters();

  const activeFilterEntries = Object.entries(filters).flatMap(([filterKey, values]) =>
    values.map((value) => ({
      key: `${filterKey}-${value}`,
      label: `${filterLabelByKey[filterKey as keyof typeof filterLabelByKey]}: ${value}`
    }))
  );

  if (activeFilterEntries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay filtros activos.
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {activeFilterEntries.map((filterEntry) => (
        <Chip key={filterEntry.key} label={filterEntry.label} />
      ))}
    </Stack>
  );
}
