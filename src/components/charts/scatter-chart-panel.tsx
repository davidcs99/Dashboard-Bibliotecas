"use client";

import { ChartPanel } from "@/components/charts/chart-panel";
import { buildScatterChartOptions } from "@/lib/echarts/chart-options";

type ScatterChartDatum = {
  name: string;
  users: number;
  events: number;
};

type ScatterChartPanelProperties = {
  title: string;
  description: string;
  data: ScatterChartDatum[];
};

export function ScatterChartPanel({
  title,
  description,
  data
}: ScatterChartPanelProperties) {
  return (
    <ChartPanel
      title={title}
      description={description}
      options={buildScatterChartOptions(data)}
    />
  );
}
