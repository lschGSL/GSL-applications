import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// Create a new application
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify admin/manager
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

  const body = await request.json();
  const { name, slug, description, url, visibility } = body;

  if (!name || !slug || !url) {
    return NextResponse.json(
      { error: "Name, slug, and URL are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({ name, slug, description, url, visibility: visibility || "internal" })
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
    resource_type: "application",
    resource_id: data.id,
    details: { name, slug, url },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json(data, { status: 201 });
}
