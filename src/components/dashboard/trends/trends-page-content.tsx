"use client";

import { Box } from "@mui/material";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { BarChartPanel } from "@/components/charts/bar-chart-panel";
import { GroupedBarChartPanel } from "@/components/charts/grouped-bar-chart-panel";
import { LineChartPanel } from "@/components/charts/line-chart-panel";
import { DataRefreshIndicator } from "@/components/feedback/data-refresh-indicator";
import { PageErrorState } from "@/components/feedback/page-error-state";
import { PageLoadingState } from "@/components/feedback/page-loading-state";
import { useTrendsQuery } from "@/hooks/use-trends-query";

export function TrendsPageContent() {
  const { data, isLoading, isFetching, isError } = useTrendsQuery();

  if (isLoading && !data) {
    return <PageLoadingState />;
  }

  if (isError || !data) {
    return (
      <PageErrorState
        title="No fue posible cargar las tendencias"
        description="Revisa el archivo CSV o intenta nuevamente en unos segundos."
      />
    );
  }

  const monthlyUsageTrend = data.monthlyUsageTrend ?? [];
  const dailyPeakUsage = data.dailyPeakUsage ?? [];
  const operationTrendByYear = data.operationTrendByYear ?? [];

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
          <LineChartPanel
            title="Accesos Mensuales a Recursos"
            description="Evolución mensual de accesos reales a recursos digitales con operacion URL."
            data={monthlyUsageTrend}
            categoryKey="month"
            primaryValueKey="value"
            primarySeriesName="Accesos URL"
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Días con Mayor Actividad"
            description="Fechas con picos relevantes que conviene revisar."
            data={dailyPeakUsage}
            categoryKey="label"
            valueKey="value"
            seriesName="Eventos"
          />
        </Box>
        <Box>
          <GroupedBarChartPanel
            title="Evolución por Tipo de Operación"
            description="Columnas agrupadas por año para comparar búsquedas, logins y accesos URL."
            data={operationTrendByYear}
            categoryKey="year"
            seriesDefinitions={[
              { key: "search", name: "SEARCH", color: "#0b7285" },
              { key: "loginSuccess", name: "LOGIN-SUCCESS", color: "#f08c00" },
              { key: "url", name: "URL", color: "#106ba3" }
            ]}
          />
        </Box>
      </Box>
    </>
  );
}
