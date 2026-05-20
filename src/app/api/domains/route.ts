import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withDomainCounts } from "@/lib/domains";
import type { Domain } from "@/types/database";

/**
 * GET /api/domains
 * Liste publique (utilisateurs authentifiés) des domaines actifs, avec counts.
 * Les counts respectent la RLS de l'utilisateur appelant (un non-admin ne voit
 * que les procedures publiées, etc.).
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const withCounts = await withDomainCounts(supabase, (data ?? []) as Domain[]);
  return NextResponse.json(withCounts);
}
