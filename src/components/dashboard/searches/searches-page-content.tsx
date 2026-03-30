"use client";

import { Box } from "@mui/material";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { BarChartPanel } from "@/components/charts/bar-chart-panel";
import { DataRefreshIndicator } from "@/components/feedback/data-refresh-indicator";
import { PageErrorState } from "@/components/feedback/page-error-state";
import { PageLoadingState } from "@/components/feedback/page-loading-state";
import { useSearchesQuery } from "@/hooks/use-searches-query";

export function SearchesPageContent() {
  const { data, isLoading, isFetching, isError } = useSearchesQuery();

  if (isLoading && !data) {
    return <PageLoadingState />;
  }

  if (isError || !data) {
    return (
      <PageErrorState
        title="No fue posible cargar las búsquedas"
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
            title="Términos Más Buscados"
            description="Identifica necesidades informacionales recurrentes."
            data={data.topSearchTerms}
            categoryKey="label"
            valueKey="value"
            seriesName="Busquedas"
            chartHeight={420}
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Distribución de Búsquedas por Sede"
            description="Permite ubicar dónde se concentra la intención de consulta."
            data={data.searchVolumeByCampus}
            categoryKey="label"
            valueKey="value"
            seriesName="Busquedas"
            orientation="horizontal"
            chartHeight={400}
            invertCategoryAxis
          />
        </Box>
      </Box>
    </>
  );
}
