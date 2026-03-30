"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { buildBarChartOptions } from "@/lib/echarts/chart-options";

type BarChartPanelProperties<TData extends Record<string, string | number>> = {
  title: string;
  description: string;
  data: TData[];
  categoryKey: keyof TData;
  valueKey: keyof TData;
  seriesName: string;
  orientation?: "vertical" | "horizontal";
  chartHeight?: number;
  invertCategoryAxis?: boolean;
};

export function BarChartPanel<TData extends Record<string, string | number>>({
  title,
  description,
  data,
  categoryKey,
  valueKey,
  seriesName,
  orientation = "vertical",
  chartHeight,
  invertCategoryAxis = false
}: BarChartPanelProperties<TData>) {
  return (
    <ChartPanel
      title={title}
      description={description}
      options={buildBarChartOptions(
        data,
        categoryKey,
        valueKey,
        seriesName,
        orientation,
        invertCategoryAxis
      )}
      chartHeight={chartHeight}
    />
  );
}
