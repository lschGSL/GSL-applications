import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendInvitationEmail } from "@/lib/email/resend";

// Create an invitation
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, role, entity } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
  }

  // Check for pending invitation
  const { data: existingInvite } = await supabase
    .from("invitations")
    .select("id")
    .eq("email", email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json({ error: "A pending invitation already exists for this email" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      email,
      role: role || "member",
      entity: entity || null,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Audit log
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "create",
    resource_type: "invitation",
    resource_id: data.id,
    details: { email, role: role || "member", entity },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Send invitation email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const signupUrl = `${appUrl}/register?invite=${data.token}`;

  sendInvitationEmail({
    email,
    invitedBy: profile.full_name || profile.email,
    role: role || "member",
    entity,
    signupUrl,
  }).catch(() => {});

  return NextResponse.json(data, { status: 201 });
}

// List invitations
export async function GET() {
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

  const { data: invitations } = await supabase
    .from("invitations")
    .select(`
      *,
      profiles:invited_by (full_name, email)
    `)
    .order("created_at", { ascending: false });

  return NextResponse.json(invitations ?? []);
}
