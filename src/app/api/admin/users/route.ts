import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { webhookNewUser } from "@/lib/webhooks";
import { sendWelcomeEmail } from "@/lib/email/resend";

// Invite a new user (admin/manager only)
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, full_name, role, entity } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const validRoles = ["admin", "manager", "member", "viewer", "client"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Build redirect URL from request headers
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const portalUrl = `${proto}://${host}`;

  // Invite user via Supabase (sends magic link email for password setup)
  const serviceClient = await createServiceClient();
  const { data: authData, error: authError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${portalUrl}/auth/callback?next=/welcome`,
    data: {
      full_name: full_name || null,
      role: role || "member",
      entity: entity || null,
    },
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

  // Send branded GSL welcome email via Resend
  sendWelcomeEmail({
    email,
    fullName: full_name || null,
    invitedBy: profile.full_name || "GSL",
    role: role || "member",
    entity: entity || null,
    portalUrl,
  }).catch(() => {});

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "create",
    resource_type: "user",
    resource_id: authData.user?.id,
    details: { email, role: role || "member", entity: entity || null, method: "invite" },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Webhook
  webhookNewUser(full_name || "", email, role || "member").catch(() => {});

  return NextResponse.json({ id: authData.user?.id, email }, { status: 201 });
}
