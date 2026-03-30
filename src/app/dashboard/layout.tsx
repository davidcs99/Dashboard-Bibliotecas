import { AppShell } from "@/components/layout/app-shell";

type DashboardLayoutProperties = Readonly<{
  children: React.ReactNode;
}>;

export default function DashboardLayout({ children }: DashboardLayoutProperties) {
  return <AppShell>{children}</AppShell>;
}
