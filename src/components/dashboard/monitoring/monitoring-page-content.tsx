"use client";

import { FilterToolbar } from "@/components/filters/filter-toolbar";
import { DataRefreshIndicator } from "@/components/feedback/data-refresh-indicator";
import { PageErrorState } from "@/components/feedback/page-error-state";
import { PageLoadingState } from "@/components/feedback/page-loading-state";
import { UserMonitoringTable } from "@/components/tables/user-monitoring-table";
import { useMonitoringQuery } from "@/hooks/use-monitoring-query";

export function MonitoringPageContent() {
  const { data, isLoading, isFetching, isError } = useMonitoringQuery();

  if (isLoading && !data) {
    return <PageLoadingState />;
  }

  if (isError || !data) {
    return (
      <PageErrorState
        title="No fue posible cargar el seguimiento individual"
        description="Revisa el archivo CSV o intenta nuevamente en unos segundos."
      />
    );
  }

  return (
    <>
      <DataRefreshIndicator visible={isFetching} />
      <FilterToolbar filterOptions={data.filterOptions} includeUserFilter />
      <UserMonitoringTable rows={data.monitoringUsers} />
    </>
  );
}
