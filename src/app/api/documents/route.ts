import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// List documents
export async function GET(request: NextRequest) {
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

  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = request.nextUrl.searchParams.get("client_id");

  // Clients can only see their own documents
  if (profile.role === "client") {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    return NextResponse.json(data ?? []);
  }

  // Admins/managers
  if (!["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data } = await query;
  return NextResponse.json(data ?? []);
}
