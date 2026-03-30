"use client";

import { Box } from "@mui/material";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { BarChartPanel } from "@/components/charts/bar-chart-panel";
import { DonutChartPanel } from "@/components/charts/donut-chart-panel";
import { DataRefreshIndicator } from "@/components/feedback/data-refresh-indicator";
import { PageErrorState } from "@/components/feedback/page-error-state";
import { PageLoadingState } from "@/components/feedback/page-loading-state";
import { useResourcesQuery } from "@/hooks/use-resources-query";

export function ResourcesPageContent() {
  const { data, isLoading, isFetching, isError } = useResourcesQuery();

  if (isLoading && !data) {
    return <PageLoadingState />;
  }

  if (isError || !data) {
    return (
      <PageErrorState
        title="No fue posible cargar los recursos"
        description="Revisa el archivo CSV o intenta nuevamente en unos segundos."
      />
    );
  }

  const topResources = data.topResources ?? [];
  const resourceTypeDistribution = data.resourceTypeDistribution ?? [];
  const uniqueUsersByResource = data.uniqueUsersByResource ?? [];
  const leastUsedResources = data.leastUsedResources ?? [];
  const resourceUsageByPrimaryRoles = data.resourceUsageByPrimaryRoles ?? [];

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
            title="Recursos Más Utilizados"
            description="Ranking de recursos con mayor volumen de accesos."
            data={topResources}
            categoryKey="label"
            valueKey="value"
            seriesName="Accesos"
            orientation="horizontal"
            chartHeight={500}
            invertCategoryAxis
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Usuarios Únicos por Recurso"
            description="Permite diferenciar recursos de alto volumen frente a recursos con adopción amplia."
            data={uniqueUsersByResource}
            categoryKey="label"
            valueKey="value"
            seriesName="Usuarios"
            orientation="horizontal"
            chartHeight={500}
            invertCategoryAxis
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Bibliotecas Más Usadas por Estudiantes"
            description="Ranking de recursos con mayor uso dentro del segmento estudiantil."
            data={resourceUsageByPrimaryRoles
              .filter((item) => item.student > 0)
              .sort((leftItem, rightItem) => rightItem.student - leftItem.student)
              .map((item) => ({
                label: item.resource,
                value: item.student
              }))}
            categoryKey="label"
            valueKey="value"
            seriesName="Estudiantes"
            orientation="horizontal"
            chartHeight={480}
            invertCategoryAxis
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Bibliotecas Más Usadas por Docentes"
            description="Ranking de recursos con mayor uso dentro del segmento docente."
            data={resourceUsageByPrimaryRoles
              .filter((item) => item.teacher > 0)
              .sort((leftItem, rightItem) => rightItem.teacher - leftItem.teacher)
              .map((item) => ({
                label: item.resource,
                value: item.teacher
              }))}
            categoryKey="label"
            valueKey="value"
            seriesName="Docentes"
            orientation="horizontal"
            chartHeight={480}
            invertCategoryAxis
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Bibliotecas Menos Usadas"
            description="Identifica recursos con menor volumen de acceso para detectar subutilización."
            data={leastUsedResources}
            categoryKey="label"
            valueKey="value"
            seriesName="Accesos"
            orientation="horizontal"
            chartHeight={440}
            invertCategoryAxis
          />
        </Box>
        <Box>
          <DonutChartPanel
            title="Distribución por Tipo de Recurso"
            description="Participación relativa de los distintos tipos de recurso."
            data={resourceTypeDistribution}
            labelKey="label"
            valueKey="value"
            chartHeight={440}
          />
        </Box>
      </Box>
    </>
  );
}
