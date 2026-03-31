"use client";

import { Box, Button, Card, Divider, Stack, Typography } from "@mui/material";
import { FilterSelect } from "@/components/filters/filter-select";
import { ActiveFiltersSummary } from "@/components/filters/active-filters-summary";
import { useDashboardFiltersStore } from "@/store/use-dashboard-filters-store";
import type { DashboardFilterOptions } from "@/types/dashboard";

type FilterToolbarProperties = {
  filterOptions: DashboardFilterOptions;
  includeUserFilter?: boolean;
};

export function FilterToolbar({
  filterOptions,
  includeUserFilter = false
}: FilterToolbarProperties) {
  const {
    selectedYears,
    selectedMonths,
    selectedCampuses,
    selectedAcademicUnits,
    selectedPrograms,
    selectedModalities,
    selectedAccessTypes,
    selectedRoles,
    selectedResources,
    selectedResourceTypes,
    selectedUsers,
    setSelectedYears,
    setSelectedMonths,
    setSelectedCampuses,
    setSelectedAcademicUnits,
    setSelectedPrograms,
    setSelectedModalities,
    setSelectedAccessTypes,
    setSelectedRoles,
    setSelectedResources,
    setSelectedResourceTypes,
    setSelectedUsers,
    resetFilters
  } = useDashboardFiltersStore();

  return (
    <Card
      sx={{
        p: 3,
        mb: 4,
        backgroundImage: "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 253, 1) 100%)"
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: "#991012", letterSpacing: 1.5, fontWeight: 700 }}>
            Centro de Analisis
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Filtros del Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Selecciona una o varias dimensiones para refinar el análisis.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={resetFilters}
          sx={{ borderRadius: 999, px: 2.4, backgroundColor: "rgba(255, 255, 255, 0.84)" }}
        >
          Limpiar filtros
        </Button>
      </Stack>

      <ActiveFiltersSummary />
      <Divider sx={{ my: 2.5 }} />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))"
          }
        }}
      >
        <Box>
          <FilterSelect label="Anio" values={selectedYears} options={filterOptions.years} onChange={setSelectedYears} />
        </Box>
        <Box>
          <FilterSelect label="Mes" values={selectedMonths} options={filterOptions.months} onChange={setSelectedMonths} />
        </Box>
        <Box>
          <FilterSelect label="Sede" values={selectedCampuses} options={filterOptions.campuses} onChange={setSelectedCampuses} />
        </Box>
        <Box>
          <FilterSelect
            label="Unidad academica"
            values={selectedAcademicUnits}
            options={filterOptions.academicUnits}
            onChange={setSelectedAcademicUnits}
          />
        </Box>
        <Box>
          <FilterSelect
            label="Carrera"
            values={selectedPrograms}
            options={filterOptions.programs}
            onChange={setSelectedPrograms}
          />
        </Box>
        <Box>
          <FilterSelect
            label="Modalidad"
            values={selectedModalities}
            options={filterOptions.modalities}
            onChange={setSelectedModalities}
          />
        </Box>
        <Box>
          <FilterSelect
            label="Tipo de acceso"
            values={selectedAccessTypes}
            options={filterOptions.accessTypes}
            onChange={setSelectedAccessTypes}
          />
        </Box>
        <Box>
          <FilterSelect label="Cargo" values={selectedRoles} options={filterOptions.roles} onChange={setSelectedRoles} />
        </Box>
        <Box>
          <FilterSelect
            label="Recurso"
            values={selectedResources}
            options={filterOptions.resources}
            onChange={setSelectedResources}
          />
        </Box>
        <Box>
          <FilterSelect
            label="Tipo de recurso"
            values={selectedResourceTypes}
            options={filterOptions.resourceTypes}
            onChange={setSelectedResourceTypes}
          />
        </Box>
        {includeUserFilter ? (
          <Box>
            <FilterSelect
              label="Usuario"
              values={selectedUsers}
              options={filterOptions.users}
              onChange={setSelectedUsers}
            />
          </Box>
        ) : null}
      </Box>
    </Card>
  );
}
