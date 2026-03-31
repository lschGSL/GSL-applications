import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// List ALL users (profiles + orphaned auth users) with auth metadata
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

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, entity, is_active, created_at, updated_at")
    .order("full_name");

  // Fetch ALL auth users
  const serviceClient = await createServiceClient();
  const { data: authUsers } = await serviceClient.auth.admin.listUsers();

  const profileMap = new Map<string, (typeof profiles extends (infer T)[] | null ? T : never)>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

  // Build unified list: profiles enriched with auth + orphaned auth users
  const result: Array<{
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    entity: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    has_profile: boolean;
    auth: {
      last_sign_in_at: string | null;
      email_confirmed_at: string | null;
      created_at: string;
    } | null;
  }> = [];

  const seen = new Set<string>();

  // First: all profiles enriched with auth data
  for (const p of profiles ?? []) {
    seen.add(p.id);
    const authUser = authUsers?.users?.find((u) => u.id === p.id);
    result.push({
      ...p,
      has_profile: true,
      auth: authUser ? {
        last_sign_in_at: authUser.last_sign_in_at || null,
        email_confirmed_at: authUser.email_confirmed_at || null,
        created_at: authUser.created_at,
      } : null,
    });
  }

  // Second: orphaned auth users (exist in auth but NOT in profiles)
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      if (!seen.has(u.id)) {
        const meta = u.user_metadata as Record<string, unknown> || {};
        result.push({
          id: u.id,
          email: u.email || "unknown",
          full_name: (meta.full_name as string) || null,
          role: (meta.role as string) || "member",
          entity: (meta.entity as string) || null,
          is_active: true,
          created_at: u.created_at,
          updated_at: u.created_at,
          has_profile: false,
          auth: {
            last_sign_in_at: u.last_sign_in_at || null,
            email_confirmed_at: u.email_confirmed_at || null,
            created_at: u.created_at,
          },
        });
      }
    }
  }

  return NextResponse.json(result);
}
