"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { buildLineChartOptions } from "@/lib/echarts/chart-options";

type AdditionalSeries = {
  key: string;
  name: string;
};

type LineChartPanelProperties<TData extends Record<string, string | number>> = {
  title: string;
  description: string;
  data: TData[];
  categoryKey: keyof TData;
  primaryValueKey: keyof TData;
  primarySeriesName: string;
  additionalSeries?: AdditionalSeries[];
};

export function LineChartPanel<TData extends Record<string, string | number>>({
  title,
  description,
  data,
  categoryKey,
  primaryValueKey,
  primarySeriesName,
  additionalSeries = []
}: LineChartPanelProperties<TData>) {
  return (
    <ChartPanel
      title={title}
      description={description}
      options={buildLineChartOptions(data, categoryKey, primaryValueKey, primarySeriesName, additionalSeries)}
    />
  );
}
