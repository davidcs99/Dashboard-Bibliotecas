"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { dashboardNavigationItems } from "@/lib/navigation/dashboard-navigation-items";
import { useDashboardFiltersStore } from "@/store/use-dashboard-filters-store";

const iconByKey = {
  summary: <BarChartOutlinedIcon />,
  resources: <BookOutlinedIcon />,
  users: <PeopleAltOutlinedIcon />,
  trends: <QueryStatsOutlinedIcon />,
  searches: <ManageSearchOutlinedIcon />,
  monitoring: <VerifiedUserOutlinedIcon />
};

export function DashboardSidebar() {
  const currentPathname = usePathname();
  const resetFilters = useDashboardFiltersStore((state) => state.resetFilters);

  return (
    <Box
      component="aside"
      sx={{
        width: 280,
        display: { xs: "none", lg: "block" },
        borderRight: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        p: 3
      }}
    >
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Dashboard Bibliotecas
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analitica institucional de uso digital
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <List sx={{ p: 0 }}>
        {dashboardNavigationItems.map((navigationItem) => {
          const isActive = currentPathname === navigationItem.path;

          return (
            <ListItemButton
              key={navigationItem.key}
              component={Link}
              href={navigationItem.path}
              onClick={() => {
                if (currentPathname !== navigationItem.path) {
                  resetFilters();
                }
              }}
              selected={isActive}
              sx={{ borderRadius: 2, mb: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{iconByKey[navigationItem.key]}</ListItemIcon>
              <ListItemText primary={navigationItem.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
