import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
  if (typeof body.slug === "string") {
    if (!body.slug.trim()) {
      return NextResponse.json({ error: "Le slug ne peut pas être vide." }, { status: 400 });
    }
    updates.slug = body.slug.trim();
  }
  if (typeof body.name === "string") {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "Le nom ne peut pas être vide." }, { status: 400 });
    }
    updates.name = body.name.trim();
  }
  if (body.icon !== undefined) updates.icon = body.icon?.trim() || null;
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 0;
  if (typeof body.published === "boolean") updates.published = body.published;
  if (body.placeholder !== undefined) updates.placeholder = body.placeholder?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("procedure_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 400;
    const message =
      error.code === "23505"
        ? "Ce slug existe déjà."
        : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "update",
    resource_type: "procedure_category",
    resource_id: id,
    details: updates,
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json(data);
}

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

  // Guard : interdire la suppression d'une catégorie encore rattachée à des
  // procédures — la suppression mettrait silencieusement leur category_id à
  // NULL (ON DELETE SET NULL). On protège ainsi les données existantes.
  const { count, error: countError } = await supabase
    .from("procedures")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Suppression impossible : ${count} procédure(s) sont rattachée(s) à cette catégorie. Détachez-les d'abord.`,
      },
      { status: 409 },
    );
  }

  const { data: existing } = await supabase
    .from("procedure_categories")
    .select("slug, name")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("procedure_categories")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "delete",
    resource_type: "procedure_category",
    resource_id: id,
    details: existing ?? {},
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
