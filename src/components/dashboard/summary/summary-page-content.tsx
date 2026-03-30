"use client";

import { Box } from "@mui/material";
import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { KpiCardGrid } from "@/components/kpi/kpi-card-grid";
import { BarChartPanel } from "@/components/charts/bar-chart-panel";
import { LineChartPanel } from "@/components/charts/line-chart-panel";
import { DataRefreshIndicator } from "@/components/feedback/data-refresh-indicator";
import { PageErrorState } from "@/components/feedback/page-error-state";
import { PageLoadingState } from "@/components/feedback/page-loading-state";
import { useSummaryQuery } from "@/hooks/use-summary-query";

export function SummaryPageContent() {
  const { data, isLoading, isFetching, isError } = useSummaryQuery();

  if (isLoading && !data) {
    return <PageLoadingState showKpiSkeletons />;
  }

  if (isError || !data) {
    return (
      <PageErrorState
        title="No fue posible cargar el resumen"
        description="Revisa el archivo CSV o intenta nuevamente en unos segundos."
      />
    );
  }

  return (
    <Box>
      <DataRefreshIndicator visible={isFetching} />
      <FilterToolbar filterOptions={data.filterOptions} />
      <KpiCardGrid cards={data.summaryKpis} />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1fr"
          }
        }}
      >
        <Box>
          <LineChartPanel
            title="Tendencia de Uso Mensual"
            description="Permite identificar crecimiento, caídas estacionales y picos de accesos URL a recursos."
            data={data.monthlyUsageTrend}
            categoryKey="month"
            primaryValueKey="value"
            primarySeriesName="Accesos URL"
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Uso por Cargo"
            description="Compara la participación de los perfiles institucionales en los accesos URL."
            data={data.usageByRole}
            categoryKey="label"
            valueKey="value"
            seriesName="Accesos URL"
            orientation="horizontal"
            chartHeight={360}
            invertCategoryAxis
          />
        </Box>
        <Box>
          <BarChartPanel
            title="Uso por Sede"
            description="Muestra la concentración de accesos URL en las distintas sedes y extensiones."
            data={data.usageByCampus}
            categoryKey="label"
            valueKey="value"
            seriesName="Accesos URL"
          />
        </Box>
      </Box>
    </Box>
  );
}
