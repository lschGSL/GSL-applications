import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendDocumentRequestNotification } from "@/lib/email/resend";

// List document requests
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

  if (profile.role === "client") {
    const { data } = await supabase
      .from("document_requests")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    return NextResponse.json(data ?? []);
  }

  if (!["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase
    .from("document_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data } = await query;
  return NextResponse.json(data ?? []);
}

// Create a document request (admin/manager only)
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
  const { client_id, title, description, folder_id, due_date } = body;

  if (!client_id || !title) {
    return NextResponse.json({ error: "client_id and title are required" }, { status: 400 });
  }

  const { data: req, error } = await supabase
    .from("document_requests")
    .insert({
      client_id,
      requested_by: user.id,
      title,
      description: description || null,
      folder_id: folder_id || null,
      due_date: due_date || null,
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
    action: "request_document",
    resource_type: "document_request",
    resource_id: req.id,
    details: { client_id, title, due_date },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Send email to client
  const { data: client } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", client_id)
    .single();

  if (client) {
    const host = headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || "http";
    const portalUrl = `${proto}://${host}`;

    await sendDocumentRequestNotification({
      clientEmail: client.email,
      clientName: client.full_name || client.email,
      requesterName: profile.full_name || profile.email,
      title,
      description,
      dueDate: due_date,
      portalUrl,
    });
  }

  return NextResponse.json(req, { status: 201 });
}
