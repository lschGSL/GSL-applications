import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendWelcomeEmail } from "@/lib/email/resend";

type ImportUser = {
  full_name: string;
  email: string;
  role: string;
  entity: string | null;
};

type ImportResult = {
  email: string;
  full_name: string;
  status: "success" | "error";
  error?: string;
};

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

  const { users } = (await request.json()) as { users: ImportUser[] };

  if (!users || users.length === 0) {
    return NextResponse.json({ error: "No users to import" }, { status: 400 });
  }

  if (users.length > 100) {
    return NextResponse.json({ error: "Maximum 100 users per import" }, { status: 400 });
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const portalUrl = `${proto}://${host}`;

  const serviceClient = await createServiceClient();
  const results: ImportResult[] = [];

  for (const u of users) {
    try {
      const { data: authData, error: authError } = await serviceClient.auth.admin.inviteUserByEmail(u.email, {
        redirectTo: `${portalUrl}/auth/callback?next=/welcome`,
        data: {
          full_name: u.full_name || null,
          role: u.role || "member",
          entity: u.entity || null,
        },
      });

      if (authError) {
        results.push({ email: u.email, full_name: u.full_name, status: "error", error: authError.message });
        continue;
      }

      // Update profile
      if (authData.user) {
        const updates: Record<string, unknown> = {};
        if (u.full_name) updates.full_name = u.full_name;
        if (u.role) updates.role = u.role;
        if (u.entity) updates.entity = u.entity;

        if (Object.keys(updates).length > 0) {
          await serviceClient.from("profiles").update(updates).eq("id", authData.user.id);
        }
      }

      // Send branded email
      sendWelcomeEmail({
        email: u.email,
        fullName: u.full_name || null,
        invitedBy: profile.full_name || "GSL",
        role: u.role || "member",
        entity: u.entity || null,
        portalUrl,
      }).catch(() => {});

      results.push({ email: u.email, full_name: u.full_name, status: "success" });
    } catch (err) {
      results.push({ email: u.email, full_name: u.full_name, status: "error", error: "Unexpected error" });
    }
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "bulk_import_users",
    resource_type: "user",
    details: {
      total: users.length,
      success: results.filter((r) => r.status === "success").length,
      errors: results.filter((r) => r.status === "error").length,
    },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({
    total: results.length,
    success: results.filter((r) => r.status === "success").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  });
}
