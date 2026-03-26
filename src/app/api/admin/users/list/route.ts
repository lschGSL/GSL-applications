import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// List all active users (for signer picker, admin only)
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

  return NextResponse.json(data ?? []);
}
