import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { sendSignatureRequestNotification } from "@/lib/email/resend";

// List signature requests for a document
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("signature_requests")
    .select(`
      *,
      signer:signer_id (full_name, email)
    `)
    .eq("document_id", id)
    .order("created_at");

  return NextResponse.json(data ?? []);
}

// Create signature requests (send to multiple signers)
export async function POST(
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
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get document
  const { data: doc } = await supabase
    .from("documents")
    .select("name, client_id")
    .eq("id", id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const body = await request.json();
  const { signer_ids } = body as { signer_ids: string[] };

  if (!signer_ids || signer_ids.length === 0) {
    return NextResponse.json({ error: "At least one signer is required" }, { status: 400 });
  }

  // Mark document as signature_required
  await supabase
    .from("documents")
    .update({ signature_required: true })
    .eq("id", id);

  // Create signature requests for each signer
  const requests = signer_ids.map((signer_id) => ({
    document_id: id,
    signer_id,
    requested_by: user.id,
    status: "pending",
  }));

  const { data: created, error } = await supabase
    .from("signature_requests")
    .upsert(requests, { onConflict: "document_id,signer_id" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Send emails to each signer
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const portalUrl = `${proto}://${host}`;

  const { data: signers } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", signer_ids);

  for (const signer of signers ?? []) {
    sendSignatureRequestNotification({
      clientEmail: signer.email,
      clientName: signer.full_name || signer.email,
      documentName: doc.name,
      requesterName: profile.full_name || profile.email,
      portalUrl,
    }).catch(() => {});
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "request_signatures",
    resource_type: "document",
    resource_id: id,
    details: { document_name: doc.name, signer_count: signer_ids.length, signer_ids },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json(created, { status: 201 });
}
