import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale } from "lucide-react";
import { formatDate } from "@/lib/utils";
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

export default async function DecisionsPage() {
  const supabase = await createClient();

  const { data: decisions } = await supabase
    .from("decisions")
    .select("*")
    .order("number", { ascending: true });

  const items = (decisions ?? []) as Decision[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Décisions</h1>
          <p className="text-muted-foreground mt-1">
            Registre des décisions d&apos;architecture (ADR) GSL.
          </p>
        </div>
        <Badge variant="secondary">{items.length} décisions</Badge>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scale className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Aucune décision publiée pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((decision) => (
            <Link
              key={decision.id}
              href={`/decisions/${decision.slug}`}
              className="group"
            >
              <Card className="h-full transition-all hover:border-[#67b9e8]/50 hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {decision.number}
                    </Badge>
                    <Badge variant={STATUS_VARIANTS[decision.status]}>
                      {decision.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg font-semibold leading-snug group-hover:text-[#67b9e8]">
                    {decision.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {decision.summary && (
                    <p className="text-sm text-muted-foreground">
                      {decision.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-end border-t pt-3 text-xs text-muted-foreground">
                    <span>MAJ {formatDate(decision.updated_at)}</span>
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
