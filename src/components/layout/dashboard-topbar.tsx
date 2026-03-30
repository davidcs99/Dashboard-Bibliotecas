"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";

export function DashboardTopbar() {
  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(244, 246, 251, 0.88)",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: { xs: 2, md: 4 },
        py: 2.25
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography variant="h5" sx={{ letterSpacing: -0.4 }}>
            Analitica de Bibliotecas Digitales
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Dashboard institucional para analizar uso, comportamiento y aprovechamiento de recursos digitales.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label="Next.js" color="primary" variant="outlined" size="small" />
          <Chip label="TypeScript" color="primary" variant="outlined" size="small" />
          <Chip label="ECharts" color="primary" variant="outlined" size="small" />
          <Chip label="AG Grid" color="primary" variant="outlined" size="small" />
        </Stack>
      </Stack>
    </Box>
  );
}
