import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  BarChart3,
  Users,
  Cog,
  GitBranch,
  ShieldCheck,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { ProcedureCategory, Procedure } from "@/types/database";

// Mapping slug d'icône (stocké en base) -> composant lucide-react.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "chart-bar": BarChart3,
  users: Users,
  cog: Cog,
  "git-branch": GitBranch,
  "shield-check": ShieldCheck,
  "file-text": FileText,
};

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "published") return "default";
  if (status === "archived") return "outline";
  return "secondary";
}

export default async function AdminProceduresPage() {
  const profile = await getProfile();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const [categoriesResult, proceduresResult] = await Promise.all([
    supabase
      .from("procedure_categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("procedures")
      .select("id, number, slug, title, status, version, category_id")
      .order("number", { ascending: true }),
  ]);

  const categories = (categoriesResult.data ?? []) as ProcedureCategory[];
  const procedures = (proceduresResult.data ?? []) as Pick<
    Procedure,
    "id" | "number" | "slug" | "title" | "status" | "version" | "category_id"
  >[];

  // Nombre de procédures par catégorie.
  const countByCategory = new Map<string, number>();
  for (const p of procedures) {
    if (p.category_id) {
      countByCategory.set(
        p.category_id,
        (countByCategory.get(p.category_id) ?? 0) + 1
      );
    }
  }

  // Nom de catégorie par id (pour le tableau des procédures).
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procédures</h1>
          <p className="text-muted-foreground mt-1">
            Catalogue des procédures GSL et de leurs catégories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{categories.length} catégories</Badge>
          <Badge variant="secondary">{procedures.length} procédures</Badge>
        </div>
      </div>

      {/* Catégories */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Catégories
        </h2>
        {categories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const Icon = (cat.icon && CATEGORY_ICONS[cat.icon]) || BookOpen;
              const count = countByCategory.get(cat.id) ?? 0;
              return (
                <Card key={cat.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {cat.name}
                    </CardTitle>
                    <Badge variant={cat.published ? "default" : "secondary"}>
                      {cat.published ? "Publiée" : "Brouillon"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {count} procédure{count > 1 ? "s" : ""}
                    </p>
                    {!cat.published && cat.placeholder && (
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        {cat.placeholder}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune catégorie. Lancez le seed pour les créer.
          </p>
        )}
      </section>

      {/* Procédures */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Procédures
        </h2>
        <Card>
          <CardContent className="p-0">
            {procedures.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Numéro</th>
                    <th className="px-4 py-3 font-medium">Titre</th>
                    <th className="px-4 py-3 font-medium">Catégorie</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Version</th>
                  </tr>
                </thead>
                <tbody>
                  {procedures.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{p.number}</td>
                      <td className="px-4 py-3">{p.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.category_id
                          ? categoryName.get(p.category_id) ?? "—"
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(p.status)}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.version}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                Aucune procédure enregistrée.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
