import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { AddAppDialog } from "@/components/admin/add-app-dialog";
import { SearchInput } from "@/components/admin/search-input";
import { AppsTable } from "@/components/admin/apps-table";
import { Badge } from "@/components/ui/badge";

export default async function AdminAppsPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string; q?: string }>;
}) {
  const profile = await getProfile();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = params.q?.toLowerCase() ?? "";

  const supabase = await createClient();
  const { data: allApps } = await supabase
    .from("applications")
    .select("*")
    .order("name");

  const apps = query
    ? allApps?.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.slug.toLowerCase().includes(query) ||
          a.url.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query)
      )
    : allApps;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Management</h1>
          <p className="text-muted-foreground mt-1">
            Register and manage applications in the portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddAppDialog showDialog={params.add === "true"} />
          <Badge variant="secondary">{apps?.length ?? 0} apps</Badge>
        </div>
      </div>

      <SearchInput placeholder="Search apps by name, slug, or URL..." />

      <AppsTable apps={apps ?? []} />
    </div>
  );
}
