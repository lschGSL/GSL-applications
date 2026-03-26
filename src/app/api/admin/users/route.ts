import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { webhookNewUser } from "@/lib/webhooks";

// Create a new user directly (admin/manager only)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, full_name, role, entity } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 12) {
    return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
  }

  const validRoles = ["admin", "manager", "member", "viewer", "client"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Create auth user via service role (bypasses email confirmation)
  const serviceClient = await createServiceClient();
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || null },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Update profile with role and entity
  if (authData.user) {
    const updates: Record<string, unknown> = {};
    if (full_name) updates.full_name = full_name;
    if (role) updates.role = role;
    if (entity) updates.entity = entity;

    if (Object.keys(updates).length > 0) {
      await serviceClient
        .from("profiles")
        .update(updates)
        .eq("id", authData.user.id);
    }
  }

  // Audit log
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "create",
    resource_type: "user",
    resource_id: authData.user?.id,
    details: { email, role: role || "member", entity: entity || null },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Webhook
  webhookNewUser(full_name || "", email, role || "member").catch(() => {});

  return NextResponse.json({ id: authData.user?.id, email }, { status: 201 });
}
