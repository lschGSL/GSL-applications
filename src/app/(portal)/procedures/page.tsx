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
import { DomainFilterBar } from "@/components/domains/domain-filter-bar";
import { DomainBadge } from "@/components/domains/domain-badge";
import { ViewToggle, type ViewMode } from "@/components/domains/view-toggle";
import { withDomainCounts, groupByDomain } from "@/lib/domains";
import type { Procedure } from "@/types/procedures";
import type { Domain } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProceduresPage({
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
    .from("procedures")
    .select("*")
    .eq("status", "published")
    .order("number", { ascending: true });
  if (activeDomainId) query = query.eq("domain_id", activeDomainId);

  const { data: procedures } = await query;
  const items = (procedures ?? []) as Procedure[];
  const domainsById = new Map(domains.map((d) => [d.id, d]));

  const renderCard = (procedure: Procedure) => {
    const domain = procedure.domain_id ? domainsById.get(procedure.domain_id) : null;
    return (
      <Link key={procedure.id} href={`/procedures/${procedure.slug}`} className="group">
        <Card className="h-full transition-all hover:border-[#67b9e8]/50 hover:shadow-md">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-[11px]">
                {procedure.number}
              </Badge>
              <CategoryBadge category={procedure.category} />
              {domain && <DomainBadge domain={domain} />}
            </div>
            <CardTitle className="mt-2 text-lg font-semibold leading-snug group-hover:text-[#67b9e8]">
              {procedure.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {procedure.summary && (
              <p className="text-sm text-muted-foreground">{procedure.summary}</p>
            )}
            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>Version {procedure.version}</span>
              <span>MAJ {formatDate(procedure.updated_at)}</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Procédures</h1>
          <p className="text-muted-foreground mt-1">
            Procédures internes GSL accessibles à tous les collaborateurs.
          </p>
        </div>
        <Badge variant="secondary">{items.length} procédures</Badge>
      </div>

      {domains.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DomainFilterBar domains={domains} countField="procedure_count" />
          <ViewToggle current={viewMode} />
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Aucune procédure publiée pour le moment.
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
