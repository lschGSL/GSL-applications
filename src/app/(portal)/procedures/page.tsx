import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/procedures/category-badge";
import type { Procedure } from "@/types/procedures";

export const dynamic = "force-dynamic";

export default async function ProceduresPage() {
  const supabase = await createClient();

  const { data: procedures } = await supabase
    .from("procedures")
    .select("*")
    .eq("status", "published")
    .order("number", { ascending: true });

  const items = (procedures ?? []) as Procedure[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procédures</h1>
          <p className="text-muted-foreground mt-1">
            Procédures internes GSL accessibles à tous les collaborateurs.
          </p>
        </div>
        <Badge variant="secondary">{items.length} procédures</Badge>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Aucune procédure publiée pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((procedure) => (
            <Link
              key={procedure.id}
              href={`/procedures/${procedure.slug}`}
              className="group"
            >
              <Card className="h-full transition-all hover:border-[#67b9e8]/50 hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {procedure.number}
                    </Badge>
                    <CategoryBadge category={procedure.category} />
                  </div>
                  <CardTitle className="mt-2 text-lg font-semibold leading-snug group-hover:text-[#67b9e8]">
                    {procedure.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {procedure.summary && (
                    <p className="text-sm text-muted-foreground">
                      {procedure.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span>Version {procedure.version}</span>
                    <span>MAJ {formatDate(procedure.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
