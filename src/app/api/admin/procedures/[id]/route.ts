import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  PROCEDURE_CATEGORIES,
  PROCEDURE_STATUSES,
  type ProcedureCategory,
  type ProcedureStatus,
} from "@/types/procedures";

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

  if (typeof body.number === "string") updates.number = body.number;
  if (typeof body.slug === "string") updates.slug = body.slug;
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.category === "string") {
    if (!PROCEDURE_CATEGORIES.includes(body.category as ProcedureCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    updates.category = body.category;
  }
  if (body.summary !== undefined) updates.summary = body.summary || null;
  if (typeof body.content === "string") updates.content = body.content;
  if (typeof body.version === "string") updates.version = body.version;
  if (body.owner !== undefined) updates.owner = body.owner || null;
  if (typeof body.status === "string") {
    if (!PROCEDURE_STATUSES.includes(body.status as ProcedureStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("procedures")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "update",
    resource_type: "procedure",
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

  const { data: existing } = await supabase
    .from("procedures")
    .select("number, slug, title")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("procedures").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "delete",
    resource_type: "procedure",
    resource_id: id,
    details: existing ?? {},
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
