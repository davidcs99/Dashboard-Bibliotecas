"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
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
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 20,
        overflowY: "auto",
        borderRight: "1px solid",
        borderColor: "divider",
        background: "linear-gradient(180deg, rgba(45, 62, 89, 0.98) 0%, rgba(64, 79, 102, 0.98) 100%)",
        p: 3
      }}
    >
      <Box
        sx={{
          mb: 3.5,
          pb: 2.5,
          borderBottom: "1px solid rgba(255, 255, 255, 0.12)"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            mb: 2.5,
            minHeight: 64
          }}
        >
          <Image
            src="/images/branding/ucacue-logo.png"
            alt="Logo UCACUE"
            width={132}
            height={52}
            style={{ width: "100%", height: "auto", maxWidth: 132 }}
            priority
          />
        </Box>
        <Typography
          variant="h5"
          sx={{
            mb: 0.9,
            lineHeight: 1.08,
            maxWidth: 190,
            color: "#ffffff",
            letterSpacing: -0.8,
            textWrap: "balance"
          }}
        >
          Dashboard Bibliotecas
        </Typography>
        <Typography
          variant="body2"
          sx={{
            maxWidth: 224,
            color: "rgba(255, 255, 255, 0.72)",
            lineHeight: 1.65
          }}
        >
          Analitica institucional de uso digital
        </Typography>
      </Box>

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
              sx={{
                borderRadius: 3,
                mb: 1,
                px: 1.5,
                py: 0.75,
                color: "#ffffff",
                backgroundColor: isActive ? "rgba(153, 16, 18, 0.9)" : "transparent",
                "&:hover": {
                  backgroundColor: isActive ? "rgba(153, 16, 18, 0.95)" : "rgba(255, 255, 255, 0.08)"
                },
                "& .MuiListItemIcon-root": {
                  color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.76)"
                },
                "& .MuiListItemText-primary": {
                  fontWeight: isActive ? 700 : 500
                }
              }}
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
