import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// List all active users with auth metadata (for admin panels)
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

  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("is_active", true)
    .order("full_name");

  // Enrich with auth metadata
  const serviceClient = await createServiceClient();
  const { data: authUsers } = await serviceClient.auth.admin.listUsers();

  const authMap = new Map<string, {
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    created_at: string;
  }>();

  if (authUsers?.users) {
    for (const u of authUsers.users) {
      authMap.set(u.id, {
        last_sign_in_at: u.last_sign_in_at || null,
        email_confirmed_at: u.email_confirmed_at || null,
        created_at: u.created_at,
      });
    }
  }

  const enriched = (data ?? []).map((u) => ({
    ...u,
    auth: authMap.get(u.id) || null,
  }));

  return NextResponse.json(enriched);
}
