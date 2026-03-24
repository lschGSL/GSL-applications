import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendAccessGrantedNotification, sendAccessRevokedNotification } from "@/lib/email/resend";

// Grant app access to a user
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

  const { user_id, app_id } = await request.json();

  if (!user_id || !app_id) {
    return NextResponse.json(
      { error: "user_id and app_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("app_access")
    .insert({ user_id, app_id, granted_by: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Audit log
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "grant_access",
    resource_type: "app_access",
    resource_id: data.id,
    details: { target_user: user_id, app_id },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Notify user via email
  const [{ data: targetUser }, { data: app }] = await Promise.all([
    supabase.from("profiles").select("email, full_name").eq("id", user_id).single(),
    supabase.from("applications").select("name, url").eq("id", app_id).single(),
  ]);

  if (targetUser && app) {
    sendAccessGrantedNotification({
      userEmail: targetUser.email,
      userName: targetUser.full_name || targetUser.email,
      appName: app.name,
      appUrl: app.url,
    }).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}

// Revoke app access
export async function DELETE(request: NextRequest) {
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

  const { user_id, app_id } = await request.json();

  const { error } = await supabase
    .from("app_access")
    .delete()
    .eq("user_id", user_id)
    .eq("app_id", app_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Audit log
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "revoke_access",
    resource_type: "app_access",
    details: { target_user: user_id, app_id },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Notify user via email
  const [{ data: targetUser }, { data: app }] = await Promise.all([
    supabase.from("profiles").select("email, full_name").eq("id", user_id).single(),
    supabase.from("applications").select("name").eq("id", app_id).single(),
  ]);

  if (targetUser && app) {
    sendAccessRevokedNotification({
      userEmail: targetUser.email,
      userName: targetUser.full_name || targetUser.email,
      appName: app.name,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
