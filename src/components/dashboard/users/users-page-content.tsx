"use client";

import { Box } from "@mui/material";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { BarChartPanel } from "@/components/charts/bar-chart-panel";
import { ScatterChartPanel } from "@/components/charts/scatter-chart-panel";
import { DataRefreshIndicator } from "@/components/feedback/data-refresh-indicator";
import { PageErrorState } from "@/components/feedback/page-error-state";
import { PageLoadingState } from "@/components/feedback/page-loading-state";
import { useUsersQuery } from "@/hooks/use-users-query";

export function UsersPageContent() {
  const { data, isLoading, isFetching, isError } = useUsersQuery();

  if (isLoading && !data) {
    return <PageLoadingState />;
  }

  if (isError || !data) {
    return (
      <PageErrorState
        title="No fue posible cargar la vista de usuarios"
        description="Revisa el archivo CSV o intenta nuevamente en unos segundos."
      />
    );
  }

  return (
    <>
      <DataRefreshIndicator visible={isFetching} />
      <FilterToolbar filterOptions={data.filterOptions} />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: "1fr"
        }}
      >
        <Box>
          <BarChartPanel
            title="Uso por Unidad Académica"
            description="Comparativo de accesos URL a recursos por unidad académica."
            data={data.usageByAcademicUnit}
            categoryKey="label"
            valueKey="value"
            seriesName="Accesos URL"
            orientation="horizontal"
            chartHeight={420}
            invertCategoryAxis
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Uso por Carrera"
            description="Muestra qué carreras presentan mayor volumen de accesos URL."
            data={data.usageByProgram}
            categoryKey="label"
            valueKey="value"
            seriesName="Accesos URL"
            orientation="horizontal"
            chartHeight={420}
            invertCategoryAxis
          />
        </Box>
        <Box>
          <ScatterChartPanel
            title="Usuarios Únicos vs Accesos URL por Unidad Académica"
            description="Ayuda a distinguir entre cobertura amplia e intensidad alta de accesos a recursos."
            data={data.usersVsEventsByAcademicUnit}
          />
        </Box>
      </Box>
    </>
  );
}
