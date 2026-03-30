import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendPasswordResetEmail } from "@/lib/email/resend";

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || !["admin", "manager"].includes(adminProfile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get target user
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", id)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const portalUrl = `${proto}://${host}`;

  // Generate recovery link
  const serviceClient = await createServiceClient();
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: "recovery",
    email: targetUser.email,
    options: {
      redirectTo: `${portalUrl}/auth/callback?next=/reset-password`,
    },
  });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  // Send branded reset email
  sendPasswordResetEmail({
    email: targetUser.email,
    fullName: targetUser.full_name,
    resetUrl: linkData.properties?.action_link || `${portalUrl}/forgot-password`,
    portalUrl,
  }).catch(() => {});

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "force_reset_password",
    resource_type: "user",
    resource_id: id,
    details: { email: targetUser.email },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
