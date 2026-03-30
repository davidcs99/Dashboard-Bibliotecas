"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { buildGroupedBarChartOptions } from "@/lib/echarts/chart-options";

type GroupedBarChartPanelProperties<TData extends Record<string, string | number>> = {
  title: string;
  description: string;
  data: TData[];
  categoryKey: keyof TData;
  seriesDefinitions: Array<{
    key: keyof TData;
    name: string;
    color: string;
  }>;
  chartHeight?: number;
  orientation?: "vertical" | "horizontal";
  invertCategoryAxis?: boolean;
};

export function GroupedBarChartPanel<TData extends Record<string, string | number>>({
  title,
  description,
  data,
  categoryKey,
  seriesDefinitions,
  chartHeight,
  orientation = "vertical",
  invertCategoryAxis
}: GroupedBarChartPanelProperties<TData>) {
  const safeData = data ?? [];

  return (
    <ChartPanel
      title={title}
      description={description}
      options={buildGroupedBarChartOptions(
        safeData,
        categoryKey,
        seriesDefinitions,
        orientation,
        invertCategoryAxis
      )}
      chartHeight={chartHeight}
    />
  );
}
