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
        backgroundColor: "rgba(247, 249, 252, 0.92)",
        borderBottom: "1px solid",
        borderColor: "divider",
        px: { xs: 2, md: 4 },
        py: 2.5
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
        <Box sx={{ maxWidth: 760 }}>
          <Typography variant="overline" sx={{ color: "#991012", letterSpacing: 1.8, fontWeight: 700 }}>
            Plataforma Institucional
          </Typography>
          <Typography variant="h5" sx={{ letterSpacing: -0.6, mt: 0.25 }}>
            Analitica de Bibliotecas Digitales
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 680 }}>
            Dashboard institucional para analizar uso, comportamiento y aprovechamiento de recursos digitales.
          </Typography>
        </Box>

      </Stack>
    </Box>
  );
}
