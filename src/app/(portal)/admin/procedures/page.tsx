import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProceduresTable } from "@/components/admin/procedures-table";
import type { Procedure } from "@/types/procedures";

export const dynamic = "force-dynamic";

export default async function AdminProceduresPage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("procedures")
    .select("*")
    .order("number", { ascending: true });

  const procedures = (data ?? []) as Procedure[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procédures</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les procédures internes accessibles aux collaborateurs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/admin/procedures/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle procédure
            </Link>
          </Button>
          <Badge variant="secondary">{procedures.length} procédures</Badge>
        </div>
      </div>

      <ProceduresTable procedures={procedures} />
    </div>
  );
}
