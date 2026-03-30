"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false
});

type ChartPanelProperties = {
  title: string;
  description: string;
  options: EChartsOption;
  chartHeight?: number;
};

export function ChartPanel({
  title,
  description,
  options,
  chartHeight = 360
}: ChartPanelProperties) {
  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: "\"\"",
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(45, 62, 89, 0.03) 0%, transparent 22%)",
          pointerEvents: "none"
        }
      }}
    >
      <CardContent>
        <Stack spacing={2.5}>
          <div>
            <Typography variant="h6" sx={{ mb: 0.75, letterSpacing: -0.45 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
              {description}
            </Typography>
          </div>
          <ReactECharts option={options} style={{ height: chartHeight, width: "100%" }} />
        </Stack>
      </CardContent>
    </Card>
  );
}
