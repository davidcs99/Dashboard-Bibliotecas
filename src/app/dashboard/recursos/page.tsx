import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { ResourcesPageContent } from "@/components/dashboard/resources/resources-page-content";

export default function DashboardResourcesPage() {
  return (
    <>
      <DashboardPageHeader
        title="Uso por Recursos"
        description="Analiza cuáles recursos concentran la consulta y cómo se distribuye el uso por tipo de recurso."
      />
      <ResourcesPageContent />
    </>
  );
}
