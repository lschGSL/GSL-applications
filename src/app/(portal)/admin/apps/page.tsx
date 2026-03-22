import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";
import { AddAppDialog } from "@/components/admin/add-app-dialog";
import { AppActions } from "@/components/admin/app-actions";
import type { Application } from "@/types/database";

export default async function AdminAppsPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const profile = await getProfile();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const supabase = await createClient();
  const { data: apps } = await supabase
    .from("applications")
    .select("*")
    .order("name");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Management</h1>
          <p className="text-muted-foreground mt-1">
            Register and manage applications in the portal.
          </p>
        </div>
        <AddAppDialog showDialog={params.add === "true"} />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Application
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Visibility
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {apps?.map((app: Application) => (
                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <LayoutGrid className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{app.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {app.url}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 text-sm font-mono text-muted-foreground">
                    {app.slug}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="secondary" className="capitalize">
                      {app.visibility}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={app.is_active ? "success" : "destructive"}>
                      {app.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(app.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <AppActions app={app} />
                  </td>
                </tr>
              ))}
              {(!apps || apps.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No applications registered yet.</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Click &quot;Add Application&quot; to register your first app.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
