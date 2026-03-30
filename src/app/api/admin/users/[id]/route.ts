import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// Update user role or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || !["admin", "manager"].includes(adminProfile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { role, is_active, entity } = body;

  if (id === user.id && role && role !== "admin") {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (role) updates.role = role;
  if (typeof is_active === "boolean") updates.is_active = is_active;
  if (entity !== undefined) updates.entity = entity;

  const { data, error } = await supabase
    .from("profiles")
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
    resource_type: "user",
    resource_id: id,
    details: updates,
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json(data);
}

// Delete user permanently
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (id === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  // Get user info for audit log
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", id)
    .single();

  // Delete from Supabase Auth (cascades to profiles via trigger)
  const serviceClient = await createServiceClient();
  const { error: authError } = await serviceClient.auth.admin.deleteUser(id);

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Audit log
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "delete",
    resource_type: "user",
    resource_id: id,
    details: { email: targetUser?.email, full_name: targetUser?.full_name },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
