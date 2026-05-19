import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ProcedureMarkdown } from "@/components/procedures/procedure-markdown";
import type { Decision, DecisionStatus } from "@/types/decisions";

export const dynamic = "force-dynamic";

const STATUS_VARIANTS: Record<
  DecisionStatus,
  "default" | "secondary" | "outline" | "warning" | "success"
> = {
  Accepté: "success",
  Proposé: "warning",
  Obsolète: "secondary",
  Remplacé: "outline",
};

async function fetchDecision(slug: string): Promise<Decision | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("decisions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data as Decision | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decision = await fetchDecision(slug);

  if (!decision) {
    return { title: "Décision introuvable" };
  }

  return {
    title: `${decision.number} – ${decision.title}`,
    description: decision.summary ?? undefined,
  };
}

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decision = await fetchDecision(slug);

  if (!decision) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/decisions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux décisions
        </Link>
      </Button>

      <header className="space-y-3 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[11px]">
            {decision.number}
          </Badge>
          <Badge variant={STATUS_VARIANTS[decision.status]}>
            {decision.status}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{decision.title}</h1>
        {decision.summary && (
          <p className="text-muted-foreground">{decision.summary}</p>
        )}
        <div className="text-xs text-muted-foreground">
          Mis à jour le {formatDate(decision.updated_at)}
        </div>
      </header>

      <article>
        {decision.content.trim().length > 0 ? (
          <ProcedureMarkdown content={decision.content} />
        ) : (
          <p className="text-muted-foreground italic">
            Aucun contenu pour cette décision.
          </p>
        )}
      </article>
    </div>
  );
}
