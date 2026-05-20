import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { DomainsManager } from "@/components/admin/domains-manager";
import { withDomainCounts } from "@/lib/domains";
import type { Domain } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDomainsPage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: rawDomains } = await supabase
    .from("domains")
    .select("*")
    .order("sort_order", { ascending: true });
  const domains = await withDomainCounts(supabase, (rawDomains ?? []) as Domain[]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Domaines</h1>
        <p className="text-muted-foreground mt-1">
          Taxonomie transversale partagée par les procédures, décisions et formations.
          Format colonne Items : <span className="font-mono">total (procedures/decisions/formations)</span>.
        </p>
      </div>
      <DomainsManager initialDomains={domains} />
    </div>
  );
}
