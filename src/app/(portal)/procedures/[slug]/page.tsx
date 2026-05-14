import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/procedures/category-badge";
import { ProcedureMarkdown } from "@/components/procedures/procedure-markdown";
import type { Procedure } from "@/types/procedures";

export const dynamic = "force-dynamic";

async function fetchProcedure(slug: string): Promise<Procedure | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("procedures")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return data as Procedure | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const procedure = await fetchProcedure(slug);

  if (!procedure) {
    return { title: "Procédure introuvable" };
  }

  return {
    title: `${procedure.number} – ${procedure.title}`,
    description: procedure.summary ?? undefined,
  };
}

export default async function ProcedureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const procedure = await fetchProcedure(slug);

  if (!procedure) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/procedures">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux procédures
        </Link>
      </Button>

      <header className="space-y-3 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[11px]">
            {procedure.number}
          </Badge>
          <CategoryBadge category={procedure.category} />
          <Badge variant="secondary" className="text-[11px]">
            v{procedure.version}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{procedure.title}</h1>
        {procedure.summary && (
          <p className="text-muted-foreground">{procedure.summary}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {procedure.owner && (
            <span>
              Propriétaire&nbsp;: <span className="font-medium text-foreground">{procedure.owner}</span>
            </span>
          )}
          <span>Mis à jour le {formatDate(procedure.updated_at)}</span>
        </div>
      </header>

      <article>
        {procedure.content.trim().length > 0 ? (
          <ProcedureMarkdown content={procedure.content} />
        ) : (
          <p className="text-muted-foreground italic">
            Aucun contenu pour cette procédure.
          </p>
        )}
      </article>
    </div>
  );
}
