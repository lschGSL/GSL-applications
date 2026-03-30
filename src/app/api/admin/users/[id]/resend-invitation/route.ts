import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendWelcomeEmail } from "@/lib/email/resend";

export async function POST(
  _request: NextRequest,
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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!adminProfile || !["admin", "manager"].includes(adminProfile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get target user info
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("email, full_name, role, entity")
    .eq("id", id)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const portalUrl = `${proto}://${host}`;

  // Re-invite via Supabase
  const serviceClient = await createServiceClient();
  const { error: authError } = await serviceClient.auth.admin.inviteUserByEmail(targetUser.email, {
    redirectTo: `${portalUrl}/auth/callback?next=/welcome`,
    data: {
      full_name: targetUser.full_name,
      role: targetUser.role,
      entity: targetUser.entity,
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Send branded email
  sendWelcomeEmail({
    email: targetUser.email,
    fullName: targetUser.full_name,
    invitedBy: adminProfile.full_name || "GSL",
    role: targetUser.role,
    entity: targetUser.entity,
    portalUrl,
  }).catch(() => {});

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "resend_invitation",
    resource_type: "user",
    resource_id: id,
    details: { email: targetUser.email },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
