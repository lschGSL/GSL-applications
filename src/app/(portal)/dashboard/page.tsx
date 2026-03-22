import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, Users, ScrollText, Shield, ExternalLink } from "lucide-react";
import { AppCard } from "@/components/dashboard/app-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin" || profile?.role === "manager";

  // Fetch stats and apps
  const [appsResult, usersResult, logsResult, accessResult] = await Promise.all([
    supabase.from("applications").select("*", { count: "exact", head: true }),
    isAdmin
      ? supabase.from("profiles").select("*", { count: "exact", head: true })
      : Promise.resolve({ count: 0 }),
    isAdmin
      ? supabase
          .from("audit_logs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      : Promise.resolve({ count: 0 }),
    supabase
      .from("app_access")
      .select("app_id, applications(name, slug, description, icon_url, url)")
      .eq("user_id", profile?.id ?? ""),
  ]);

  // For admins: fetch all apps directly (same query as admin page)
  let userApps = accessResult.data;
  if (isAdmin) {
    const { data: allApps } = await supabase
      .from("applications")
      .select("*")
      .order("name");
    if (allApps && allApps.length > 0) {
      userApps = allApps.map((app) => ({ app_id: app.id, applications: app }));
    }
  }

  const stats = [
    {
      name: "Total Applications",
      value: appsResult.count ?? 0,
      icon: LayoutGrid,
      visible: true,
    },
    {
      name: "Total Users",
      value: usersResult.count ?? 0,
      icon: Users,
      visible: isAdmin,
    },
    {
      name: "Events (24h)",
      value: logsResult.count ?? 0,
      icon: ScrollText,
      visible: isAdmin,
    },
    {
      name: "Your Apps",
      value: userApps?.length ?? 0,
      icon: Shield,
      visible: true,
    },
  ].filter((s) => s.visible);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {profile?.full_name || "User"}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick access apps */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Applications</h2>
        {userApps && userApps.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userApps.map((access: any) => (
              <AppCard
                key={access.app_id}
                name={access.applications?.name || "Unknown"}
                description={access.applications?.description || "No description"}
                url={access.applications?.url || ""}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No applications assigned yet.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Contact your administrator to get access.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Your role: <Badge variant="secondary" className="capitalize">{profile?.role}</Badge>
      </div>
    </div>
  );
}
