import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendDocumentStatusNotification } from "@/lib/email/resend";
import { webhookDocumentStatusChanged } from "@/lib/webhooks";

// Update document (status, notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const { status, notes } = body;

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: status === "approved" ? "approve_document" : status === "rejected" ? "reject_document" : "update_document",
    resource_type: "document",
    resource_id: id,
    details: updates,
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Notify client + webhook when document is approved or rejected
  if (status === "approved" || status === "rejected") {
    const { data: client } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", data.client_id)
      .single();

    if (client) {
      const host = headersList.get("host") || "localhost:3000";
      const proto = headersList.get("x-forwarded-proto") || "http";

      await sendDocumentStatusNotification({
        clientEmail: client.email,
        clientName: client.full_name || client.email,
        documentName: data.name,
        status,
        notes,
        portalUrl: `${proto}://${host}`,
      });

      webhookDocumentStatusChanged(client.full_name || client.email, data.name, status).catch(() => {});
    }
  }

  return NextResponse.json(data);
}

// Delete document
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Get document to find storage path
  const { data: doc } = await supabase
    .from("documents")
    .select("file_path, name")
    .eq("id", id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Delete from storage
  const serviceClient = await createServiceClient();
  await serviceClient.storage.from("documents").remove([doc.file_path]);

  // Delete from DB
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "delete_document",
    resource_type: "document",
    resource_id: id,
    details: { name: doc.name },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({ success: true });
}
