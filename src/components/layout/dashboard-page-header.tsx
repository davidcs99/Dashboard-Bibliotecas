import { Box, Typography } from "@mui/material";

type DashboardPageHeaderProperties = {
  title: string;
  description: string;
};

export function DashboardPageHeader({
  title,
  description
}: DashboardPageHeaderProperties) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 1.25, letterSpacing: -0.6 }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 880 }}>
        {description}
      </Typography>
    </Box>
  );
}
