import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProceduresTable } from "@/components/admin/procedures-table";
import { ProcedureCategoriesManager } from "@/components/admin/procedure-categories-manager";
import type { Procedure } from "@/types/procedures";
import type { ProcedureCategory } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminProceduresPage() {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [proceduresResult, categoriesResult] = await Promise.all([
    supabase.from("procedures").select("*").order("number", { ascending: true }),
    supabase
      .from("procedure_categories")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  const procedures = (proceduresResult.data ?? []) as Procedure[];
  const categories = (categoriesResult.data ?? []) as ProcedureCategory[];

  // Nombre de procédures rattachées à chaque catégorie (colonne category_id).
  const countByCategory: Record<string, number> = {};
  for (const p of (proceduresResult.data ?? []) as { category_id: string | null }[]) {
    if (p.category_id) {
      countByCategory[p.category_id] = (countByCategory[p.category_id] ?? 0) + 1;
    }
  }

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

      <ProcedureCategoriesManager
        initialCategories={categories}
        countByCategory={countByCategory}
      />
    </div>
  );
}
