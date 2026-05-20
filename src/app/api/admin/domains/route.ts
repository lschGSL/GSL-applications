import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DOMAIN_COLORS, isDomainColor, withDomainCounts } from "@/lib/domains";
import type { Domain } from "@/types/database";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

/**
 * GET /api/admin/domains
 * Liste complète (actifs + archivés) avec counts.
 */
export async function GET() {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const withCounts = await withDomainCounts(supabase, (data ?? []) as Domain[]);
  return NextResponse.json(withCounts);
}

/**
 * POST /api/admin/domains
 * Crée un nouveau domaine.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, slug, color, icon, sort_order, is_active } = body as {
    name?: string;
    slug?: string;
    color?: string;
    icon?: string | null;
    sort_order?: number;
    is_active?: boolean;
  };

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json(
      { error: "Le nom et le slug sont obligatoires." },
      { status: 400 },
    );
  }

  const finalColor = color ?? "gray";
  if (!isDomainColor(finalColor)) {
    return NextResponse.json(
      { error: `Couleur invalide. Valeurs autorisées : ${DOMAIN_COLORS.join(", ")}.` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("domains")
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      color: finalColor,
      icon: icon?.trim() || null,
      sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      is_active: is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 400;
    const message =
      error.code === "23505"
        ? `Un domaine avec le nom ou le slug « ${(name ?? slug ?? "").trim()} » existe déjà.`
        : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "create",
    resource_type: "domain",
    resource_id: data.id,
    details: { slug: data.slug, name: data.name },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json(data, { status: 201 });
}
