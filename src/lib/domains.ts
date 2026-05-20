import type { createClient } from "@/lib/supabase/server";
import type { Domain, DomainColor } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const DOMAIN_COLORS: readonly DomainColor[] = [
  "blue",
  "green",
  "amber",
  "purple",
  "teal",
  "coral",
  "pink",
  "gray",
];

export function isDomainColor(value: unknown): value is DomainColor {
  return typeof value === "string" && (DOMAIN_COLORS as readonly string[]).includes(value);
}

/**
 * Attache procedure_count / decision_count / formation_count / total_count à chaque
 * domaine. Respecte la RLS du client passé (un client non-admin ne verra que les
 * procedures publiées, etc.).
 */
export async function withDomainCounts(
  supabase: Supabase,
  domains: Domain[],
): Promise<Domain[]> {
  if (domains.length === 0) return domains;

  const [proc, dec, form] = await Promise.all([
    supabase.from("procedures").select("domain_id").not("domain_id", "is", null),
    supabase.from("decisions").select("domain_id").not("domain_id", "is", null),
    supabase.from("formations").select("domain_id").not("domain_id", "is", null),
  ]);

  const tally = (rows: { domain_id: string | null }[] | null | undefined) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      if (!row.domain_id) continue;
      map.set(row.domain_id, (map.get(row.domain_id) ?? 0) + 1);
    }
    return map;
  };

  const procMap = tally(proc.data as { domain_id: string | null }[] | null);
  const decMap = tally(dec.data as { domain_id: string | null }[] | null);
  const formMap = tally(form.data as { domain_id: string | null }[] | null);

  return domains.map((d) => {
    const p = procMap.get(d.id) ?? 0;
    const de = decMap.get(d.id) ?? 0;
    const f = formMap.get(d.id) ?? 0;
    return {
      ...d,
      procedure_count: p,
      decision_count: de,
      formation_count: f,
      total_count: p + de + f,
    };
  });
}

export interface DomainGroup<T> {
  domain: Domain | null;
  items: T[];
}

/**
 * Regroupe une liste d'items (procedures/decisions/formations) par domaine.
 * Les items sans domain_id vont dans un groupe `{ domain: null, ... }` placé en fin.
 * L'ordre des groupes suit l'ordre de `domains` (donc sort_order).
 */
export function groupByDomain<T extends { domain_id: string | null }>(
  items: T[],
  domains: Domain[],
): DomainGroup<T>[] {
  const byId = new Map<string, T[]>();
  const orphans: T[] = [];

  for (const item of items) {
    if (item.domain_id && domains.some((d) => d.id === item.domain_id)) {
      const arr = byId.get(item.domain_id) ?? [];
      arr.push(item);
      byId.set(item.domain_id, arr);
    } else {
      orphans.push(item);
    }
  }

  const groups: DomainGroup<T>[] = [];
  for (const d of domains) {
    const arr = byId.get(d.id);
    if (arr && arr.length > 0) {
      groups.push({ domain: d, items: arr });
    }
  }
  if (orphans.length > 0) {
    groups.push({ domain: null, items: orphans });
  }
  return groups;
}
