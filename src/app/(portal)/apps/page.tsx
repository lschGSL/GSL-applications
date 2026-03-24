import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid } from "lucide-react";
import { RequestAccessButton } from "@/components/apps/request-access-button";
import { OpenAppButton } from "@/components/apps/open-app-button";

export default async function AppsPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  // Fetch all active apps, filtered by user entity
  const { data: allApps } = await supabase
    .from("applications")
    .select("*")
    .eq("is_active", true)
    .order("name");

  // Filter apps by entity: show apps matching user entity, or apps with no entity restriction
  const apps = allApps?.filter((app) => {
    if (!app.entity) return true; // App is for all entities
    if (!profile?.entity) return true; // User has no entity set, show all
    if (app.entity === "both" || profile.entity === "both") return true;
    return app.entity === profile.entity;
  });

  // Fetch user's access
  const { data: access } = await supabase
    .from("app_access")
    .select("app_id")
    .eq("user_id", profile?.id ?? "");

  const accessibleAppIds = new Set(access?.map((a) => a.app_id) ?? []);
  const isAdmin = profile?.role === "admin" || profile?.role === "manager";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground mt-1">
          Browse and access company applications.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apps?.map((app) => {
          const hasAccess = isAdmin || accessibleAppIds.has(app.id);
          return (
            <Card
              key={app.id}
              className={`transition-all ${hasAccess ? "hover:shadow-md hover:border-primary/30" : "opacity-75"}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                      {app.icon_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={app.icon_url} alt="" className="h-12 w-12 object-cover rounded-lg" />
                      ) : (
                        <LayoutGrid className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{app.name}</CardTitle>
                      <div className="flex gap-1.5 mt-1">
                        <Badge variant={app.visibility === "external" ? "default" : "secondary"} className="text-xs">
                          {app.visibility}
                        </Badge>
                        {app.entity && (
                          <Badge variant="outline" className="text-xs">
                            {app.entity === "gsl_fiduciaire" ? "Fiduciaire" : app.entity === "gsl_revision" ? "Révision" : "Both"}
                          </Badge>
                        )}
                        {hasAccess ? (
                          <Badge variant="success" className="text-xs">Access granted</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">No access</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {app.description || "No description available."}
                </p>
                {hasAccess ? (
                  <OpenAppButton url={app.url} />
                ) : (
                  <RequestAccessButton appId={app.id} appName={app.name} />
                )}
              </CardContent>
            </Card>
          );
        })}

        {(!apps || apps.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No applications configured yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
