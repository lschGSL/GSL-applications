import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/actions";
import { SecurityOverviewCards } from "@/components/admin/security/security-overview-cards";
import { LiveSessionsTable } from "@/components/admin/security/live-sessions-table";
import { SecurityAlertsStream } from "@/components/admin/security/security-alerts-stream";
import { AppHealthMatrix } from "@/components/admin/security/app-health-matrix";
import { ComplianceDashboard } from "@/components/admin/security/compliance-dashboard";
import { SecurityPageHeader } from "@/components/admin/security/page-header";

export default async function SecurityDashboardPage() {
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <SecurityPageHeader />
      <SecurityOverviewCards />
      <LiveSessionsTable />
      <div className="grid gap-6 lg:grid-cols-2">
        <SecurityAlertsStream />
        <ComplianceDashboard />
      </div>
      <AppHealthMatrix />
    </div>
  );
}
