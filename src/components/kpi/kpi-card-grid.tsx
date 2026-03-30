import { Box } from "@mui/material";
import { KpiCard } from "@/components/kpi/kpi-card";
import type { KpiMetric } from "@/types/dashboard";

type KpiCardGridProperties = {
  cards: KpiMetric[];
};

export function KpiCardGrid({ cards }: KpiCardGridProperties) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        mb: 3,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          xl: "repeat(5, minmax(0, 1fr))"
        }
      }}
    >
      {cards.map((card) => (
        <Box key={card.label}>
          <KpiCard card={card} />
        </Box>
      ))}
    </Box>
  );
}
