"use client";

import { Box } from "@mui/material";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

type AppShellProperties = Readonly<{
  children: React.ReactNode;
}>;

export function AppShell({ children }: AppShellProperties) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
        position: "relative"
      }}
    >
      <DashboardSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          position: "relative",
          ml: { lg: "280px" }
        }}
      >
        <DashboardTopbar />
        <Box sx={{ p: { xs: 2, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
