import { Card, CardContent, Stack, Typography } from "@mui/material";
import type { KpiMetric } from "@/types/dashboard";

type KpiCardProperties = {
  card: KpiMetric;
};

export function KpiCard({ card }: KpiCardProperties) {
  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: "\"\"",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 4,
          background: "linear-gradient(90deg, #2D3E59 0%, #991012 60%, #E3D040 100%)"
        }
      }}
    >
      <CardContent>
        <Stack spacing={1.25} sx={{ minHeight: 148, justifyContent: "space-between" }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2, fontWeight: 700 }}>
            {card.label}
          </Typography>
          <Typography variant="h4" sx={{ letterSpacing: -0.8 }}>
            {card.value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 240 }}>
            {card.supportingText}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
