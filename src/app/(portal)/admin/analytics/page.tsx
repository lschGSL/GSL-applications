import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, LayoutGrid, ScrollText, FileText, UserCheck, UserX, Clock, TrendingUp,
} from "lucide-react";

export default async function AnalyticsPage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all stats in parallel
  const [
    usersResult,
    activeUsersResult,
    inactiveUsersResult,
    clientsResult,
    appsResult,
    docsResult,
    pendingDocsResult,
    requestsResult,
    pendingRequestsResult,
    events24hResult,
    events7dResult,
    logins24hResult,
    logins7dResult,
    recentLoginsResult,
    topAppsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("document_requests").select("*", { count: "exact", head: true }),
    supabase.from("document_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).gte("created_at", last24h),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).gte("created_at", last7d),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "sign_in").gte("created_at", last24h),
    supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "sign_in").gte("created_at", last7d),
    supabase.from("audit_logs").select("user_id, profiles:user_id(full_name, email)").eq("action", "sign_in").gte("created_at", last24h).order("created_at", { ascending: false }).limit(10),
    supabase.from("app_access").select("app_id, applications:app_id(name)"),
  ]);

  // Count apps by access
  const appAccessCounts = new Map<string, { name: string; count: number }>();
  topAppsResult.data?.forEach((a: { app_id: string; applications: { name: string } | { name: string }[] | null }) => {
    const app = Array.isArray(a.applications) ? a.applications[0] : a.applications;
    if (!app) return;
    const existing = appAccessCounts.get(a.app_id);
    if (existing) {
      existing.count++;
    } else {
      appAccessCounts.set(a.app_id, { name: app.name, count: 1 });
    }
  });
  const topApps = Array.from(appAccessCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Unique recent logins
  const seen = new Set<string>();
  const uniqueLogins = (recentLoginsResult.data ?? []).filter((l: { user_id: string }) => {
    if (seen.has(l.user_id)) return false;
    seen.add(l.user_id);
    return true;
  }).slice(0, 5);

  const stats = [
    { label: "Total Users", value: usersResult.count ?? 0, icon: Users, color: "text-blue-600" },
    { label: "Active Users", value: activeUsersResult.count ?? 0, icon: UserCheck, color: "text-green-600" },
    { label: "Inactive Users", value: inactiveUsersResult.count ?? 0, icon: UserX, color: "text-red-600" },
    { label: "Clients", value: clientsResult.count ?? 0, icon: Users, color: "text-purple-600" },
    { label: "Applications", value: appsResult.count ?? 0, icon: LayoutGrid, color: "text-indigo-600" },
    { label: "Documents", value: docsResult.count ?? 0, icon: FileText, color: "text-amber-600" },
    { label: "Pending Documents", value: pendingDocsResult.count ?? 0, icon: Clock, color: "text-orange-600" },
    { label: "Pending Requests", value: pendingRequestsResult.count ?? 0, icon: Clock, color: "text-rose-600" },
  ];

  const activity = [
    { label: "Logins (24h)", value: logins24hResult.count ?? 0 },
    { label: "Logins (7d)", value: logins7dResult.count ?? 0 },
    { label: "Events (24h)", value: events24hResult.count ?? 0 },
    { label: "Events (7d)", value: events7dResult.count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Portal usage statistics and activity overview.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{a.label}</span>
                  <span className="text-sm font-semibold">{a.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Most Accessed Apps
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topApps.length > 0 ? (
              <div className="space-y-3">
                {topApps.map((app, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{app.name}</span>
                    <Badge variant="secondary">{app.count} users</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No app access data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent logins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            Recent Logins (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uniqueLogins.length > 0 ? (
            <div className="space-y-2">
              {uniqueLogins.map((login: { user_id: string; profiles: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null }, i: number) => {
                const p = Array.isArray(login.profiles) ? login.profiles[0] : login.profiles;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                      {(p?.full_name?.[0] || p?.email?.[0] || "?").toUpperCase()}
                    </div>
                    <span>{p?.full_name || p?.email || "Unknown"}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No logins in the last 24 hours.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
