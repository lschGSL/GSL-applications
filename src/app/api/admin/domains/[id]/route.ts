import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DOMAIN_COLORS, isDomainColor } from "@/lib/domains";

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
 * PATCH /api/admin/domains/[id]
 * Met à jour un domaine. Tous les champs sont optionnels.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "Le nom ne peut pas être vide." }, { status: 400 });
    }
    updates.name = body.name.trim();
  }

  if (typeof body.slug === "string") {
    if (!body.slug.trim()) {
      return NextResponse.json({ error: "Le slug ne peut pas être vide." }, { status: 400 });
    }
    updates.slug = body.slug.trim();
  }

  if (body.color !== undefined) {
    if (!isDomainColor(body.color)) {
      return NextResponse.json(
        { error: `Couleur invalide. Valeurs autorisées : ${DOMAIN_COLORS.join(", ")}.` },
        { status: 400 },
      );
    }
    updates.color = body.color;
  }

  if (body.icon !== undefined) {
    updates.icon = typeof body.icon === "string" ? body.icon.trim() || null : null;
  }

  if (body.sort_order !== undefined) {
    updates.sort_order = Number(body.sort_order) || 0;
  }

  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("domains")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 400;
    const message = error.code === "23505" ? "Ce nom ou ce slug existe déjà." : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "update",
    resource_type: "domain",
    resource_id: id,
    details: updates,
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json(data);
}

/**
 * DELETE /api/admin/domains/[id]
 * Supprime un domaine. Bloqué si des procedures/decisions/formations y sont rattachées.
 * Pour archiver, utiliser PATCH { is_active: false }.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [proc, dec, form] = await Promise.all([
    supabase.from("procedures").select("id", { count: "exact", head: true }).eq("domain_id", id),
    supabase.from("decisions").select("id", { count: "exact", head: true }).eq("domain_id", id),
    supabase.from("formations").select("id", { count: "exact", head: true }).eq("domain_id", id),
  ]);

  for (const r of [proc, dec, form]) {
    if (r.error) {
      return NextResponse.json({ error: r.error.message }, { status: 400 });
    }
  }

  const totalRefs = (proc.count ?? 0) + (dec.count ?? 0) + (form.count ?? 0);
  if (totalRefs > 0) {
    return NextResponse.json(
      {
        error: `Suppression impossible : ${totalRefs} élément(s) rattaché(s) à ce domaine (${proc.count ?? 0} procédure(s), ${dec.count ?? 0} décision(s), ${form.count ?? 0} formation(s)). Détachez-les ou archivez le domaine (is_active=false).`,
      },
      { status: 409 },
    );
  }

  const { data: existing } = await supabase
    .from("domains")
    .select("slug, name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("domains").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "delete",
    resource_type: "domain",
    resource_id: id,
    details: existing ?? {},
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
