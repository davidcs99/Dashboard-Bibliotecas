"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { buildDonutChartOptions } from "@/lib/echarts/chart-options";

type DonutChartPanelProperties<TData extends Record<string, string | number>> = {
  title: string;
  description: string;
  data: TData[];
  labelKey: keyof TData;
  valueKey: keyof TData;
  chartHeight?: number;
};

export function DonutChartPanel<TData extends Record<string, string | number>>({
  title,
  description,
  data,
  labelKey,
  valueKey,
  chartHeight
}: DonutChartPanelProperties<TData>) {
  return (
    <ChartPanel
      title={title}
      description={description}
      options={buildDonutChartOptions(data, labelKey, valueKey)}
      chartHeight={chartHeight}
    />
  );
}
