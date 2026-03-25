import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// List folders for a client
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

  // Clients can only see their own folders
  if (profile.role === "client") {
    const { data } = await supabase
      .from("document_folders")
      .select("*")
      .eq("client_id", user.id)
      .order("name");
    return NextResponse.json(data ?? []);
  }

  // Admins/managers can see any client's folders
  if (!["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase.from("document_folders").select("*").order("name");
  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

// Create a folder (admin/manager only)
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

  const body = await request.json();
  const { name, client_id, parent_id, type, exercise_year } = body;

  if (!name || !client_id) {
    return NextResponse.json({ error: "Name and client_id are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("document_folders")
    .insert({
      name,
      client_id,
      parent_id: parent_id || null,
      type: type || null,
      exercise_year: exercise_year || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
