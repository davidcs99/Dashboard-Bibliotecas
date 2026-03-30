"use client";

import { LinearProgress } from "@mui/material";

type DataRefreshIndicatorProperties = {
  visible: boolean;
};

export function DataRefreshIndicator({
  visible
}: DataRefreshIndicatorProperties) {
  if (!visible) {
    return null;
  }

  return (
    <LinearProgress
      sx={{
        mb: 2,
        borderRadius: 999,
        height: 6
      }}
    />
  );
}
