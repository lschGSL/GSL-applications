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
import { DomainFilterBar } from "@/components/domains/domain-filter-bar";
import { DomainBadge } from "@/components/domains/domain-badge";
import { ViewToggle, type ViewMode } from "@/components/domains/view-toggle";
import { withDomainCounts, groupByDomain } from "@/lib/domains";
import type { Decision, DecisionStatus } from "@/types/decisions";
import type { Domain } from "@/types/database";

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

export default async function DecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; view?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const activeDomainSlug = params.domain ?? null;
  const viewMode: ViewMode = params.view === "grouped" ? "grouped" : "list";

  const { data: rawDomains } = await supabase
    .from("domains")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const domains = await withDomainCounts(supabase, (rawDomains ?? []) as Domain[]);

  const activeDomainId = activeDomainSlug
    ? domains.find((d) => d.slug === activeDomainSlug)?.id ?? null
    : null;

  let query = supabase
    .from("decisions")
    .select("*")
    .order("number", { ascending: true });
  if (activeDomainId) query = query.eq("domain_id", activeDomainId);

  const { data: decisions } = await query;
  const items = (decisions ?? []) as Decision[];
  const domainsById = new Map(domains.map((d) => [d.id, d]));

  const renderCard = (decision: Decision) => {
    const domain = decision.domain_id ? domainsById.get(decision.domain_id) : null;
    return (
      <Link key={decision.id} href={`/decisions/${decision.slug}`} className="group">
        <Card className="h-full transition-all hover:border-[#67b9e8]/50 hover:shadow-md">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-[11px]">
                {decision.number}
              </Badge>
              <Badge variant={STATUS_VARIANTS[decision.status]}>{decision.status}</Badge>
              {domain && <DomainBadge domain={domain} />}
            </div>
            <CardTitle className="mt-2 text-lg font-semibold leading-snug group-hover:text-[#67b9e8]">
              {decision.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {decision.summary && (
              <p className="text-sm text-muted-foreground">{decision.summary}</p>
            )}
            <div className="flex items-center justify-end border-t pt-3 text-xs text-muted-foreground">
              <span>MAJ {formatDate(decision.updated_at)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

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

      {domains.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DomainFilterBar domains={domains} countField="decision_count" />
          <ViewToggle current={viewMode} />
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scale className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Aucune décision publiée pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grouped" ? (
        <div className="space-y-10">
          {groupByDomain(items, domains).map((group) => (
            <section key={group.domain?.id ?? "unassigned"} className="space-y-4">
              <div className="flex items-center gap-3">
                {group.domain ? (
                  <DomainBadge domain={group.domain} className="text-sm px-3 py-1" />
                ) : (
                  <Badge variant="secondary" className="px-3 py-1">
                    Sans domaine
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {group.items.length}
                </span>
              </div>
              <div className="grid gap-6 md:grid-cols-2">{group.items.map(renderCard)}</div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">{items.map(renderCard)}</div>
      )}
    </div>
  );
}
