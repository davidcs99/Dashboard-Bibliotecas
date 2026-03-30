import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { TrendsPageContent } from "@/components/dashboard/trends/trends-page-content";

export default function DashboardTrendsPage() {
  return (
    <>
      <DashboardPageHeader
        title="Tendencias Temporales"
        description="Permite monitorear la evolución del uso y detectar patrones atípicos en el tiempo."
      />
      <TrendsPageContent />
    </>
  );
}
