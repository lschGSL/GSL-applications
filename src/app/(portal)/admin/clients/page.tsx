import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/admin/search-input";
import { ClientsTable } from "@/components/admin/clients-table";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await getProfile();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = params.q?.toLowerCase() ?? "";

  const supabase = await createClient();

  // Fetch all client profiles
  const { data: allClients } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  // Fetch document counts per client
  const { data: docCounts } = await supabase
    .from("documents")
    .select("client_id");

  const countMap = new Map<string, number>();
  docCounts?.forEach((d) => {
    countMap.set(d.client_id, (countMap.get(d.client_id) || 0) + 1);
  });

  const clients = query
    ? allClients?.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      )
    : allClients;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage client accounts and their documents.
          </p>
        </div>
        <Badge variant="secondary">{clients?.length ?? 0} clients</Badge>
      </div>

      <SearchInput placeholder="Search clients by name or email..." />

      <ClientsTable clients={clients ?? []} docCounts={countMap} />
    </div>
  );
}
