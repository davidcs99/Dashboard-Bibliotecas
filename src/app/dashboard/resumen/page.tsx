import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { SummaryPageContent } from "@/components/dashboard/summary/summary-page-content";

export default function DashboardSummaryPage() {
  return (
    <>
      <DashboardPageHeader
        title="Resumen Ejecutivo"
        description="Vista general del uso institucional de bibliotecas digitales con indicadores clave, tendencias y segmentación principal."
      />
      <SummaryPageContent />
    </>
  );
}
