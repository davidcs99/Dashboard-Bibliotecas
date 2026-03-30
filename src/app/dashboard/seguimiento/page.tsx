import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { MonitoringPageContent } from "@/components/dashboard/monitoring/monitoring-page-content";

export default function DashboardMonitoringPage() {
  return (
    <>
      <DashboardPageHeader
        title="Seguimiento Individual"
        description="Página orientada a equipos autorizados para analizar actividad individual, adopción y comportamiento de uso por usuario."
      />
      <MonitoringPageContent />
    </>
  );
}
