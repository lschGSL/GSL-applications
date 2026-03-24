import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendAccessRequestNotification } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { app_id } = await request.json();
  if (!app_id) {
    return NextResponse.json({ error: "app_id is required" }, { status: 400 });
  }

  // Check if already has access
  const { data: existing } = await supabase
    .from("app_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("app_id", app_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You already have access to this application" }, { status: 400 });
  }

  // Get app details and user profile for notification
  const [{ data: app }, { data: profile }] = await Promise.all([
    supabase.from("applications").select("name").eq("id", app_id).single(),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
  ]);

  // Log the access request as an audit event for admins to review
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "request_access",
    resource_type: "application",
    resource_id: app_id,
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Notify admins via email
  const { data: admins } = await supabase
    .from("profiles")
    .select("email")
    .in("role", ["admin", "manager"])
    .eq("is_active", true);

  if (admins && app && profile) {
    sendAccessRequestNotification({
      adminEmails: admins.map((a) => a.email),
      userName: profile.full_name || profile.email,
      userEmail: profile.email,
      appName: app.name,
    }).catch(() => {}); // Fire and forget
  }

  return NextResponse.json({ success: true, message: "Access request submitted" }, { status: 201 });
}
