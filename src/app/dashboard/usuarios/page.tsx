import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { UsersPageContent } from "@/components/dashboard/users/users-page-content";

export default function DashboardUsersPage() {
  return (
    <>
      <DashboardPageHeader
        title="Usuarios Académicos"
        description="Explora el uso por unidad académica, carrera y niveles de intensidad de consumo."
      />
      <UsersPageContent />
    </>
  );
}
