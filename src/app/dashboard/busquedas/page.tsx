import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { SearchesPageContent } from "@/components/dashboard/searches/searches-page-content";

export default function DashboardSearchesPage() {
  return (
    <>
      <DashboardPageHeader
        title="Análisis de Búsquedas"
        description="Evalúa el comportamiento de búsqueda y qué sedes concentran mayor volumen de consultas."
      />
      <SearchesPageContent />
    </>
  );
}
