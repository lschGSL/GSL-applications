import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ProcedureMarkdown } from "@/components/procedures/procedure-markdown";
import type { Formation } from "@/types/formations";

export const dynamic = "force-dynamic";

async function fetchFormation(slug: string): Promise<Formation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("formations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data as Formation | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const formation = await fetchFormation(slug);

  if (!formation) {
    return { title: "Fiche de formation introuvable" };
  }

  return {
    title: `${formation.number} – ${formation.title}`,
  };
}

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const formation = await fetchFormation(slug);

  if (!formation) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/formations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux formations
        </Link>
      </Button>

      <header className="space-y-3 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[11px]">
            {formation.number}
          </Badge>
          {formation.duration_min != null && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Clock className="h-3 w-3" />~{formation.duration_min} min de lecture
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{formation.title}</h1>
        <div className="text-xs text-muted-foreground">
          Mis à jour le {formatDate(formation.updated_at)}
        </div>
      </header>

      <article>
        {formation.content.trim().length > 0 ? (
          <ProcedureMarkdown content={formation.content} />
        ) : (
          <p className="text-muted-foreground italic">
            Aucun contenu pour cette fiche.
          </p>
        )}
      </article>
    </div>
  );
}
