import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

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

  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch document
  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Permission: client can sign own docs, admin/manager can sign any
  if (profile.role === "client" && doc.client_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["admin", "manager", "client"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check not already signed by this user
  const { data: existingSig } = await supabase
    .from("document_signatures")
    .select("id")
    .eq("document_id", id)
    .eq("signed_by", user.id)
    .maybeSingle();

  if (existingSig) {
    return NextResponse.json({ error: "Document already signed by you" }, { status: 400 });
  }

  // Verify password (body should contain password for identity confirmation)
  const body = await request.json();
  const { password } = body;

  if (!password) {
    return NextResponse.json({ error: "Password required to confirm identity" }, { status: 400 });
  }

  // Verify password via Supabase Auth
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (authError) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || "unknown";
  const userAgent = headersList.get("user-agent") || "";
  const signedAt = new Date().toISOString();

  // Generate signature hash: SHA-256 of (document_id + signer_id + timestamp + file_path)
  const hashInput = `${id}:${user.id}:${signedAt}:${doc.file_path}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(hashInput);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signatureHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Create signature record
  const { data: signature, error: sigError } = await supabase
    .from("document_signatures")
    .insert({
      document_id: id,
      signed_by: user.id,
      signed_at: signedAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      signature_hash: signatureHash,
      method: "simple",
      metadata: {
        signer_name: profile.full_name,
        signer_email: profile.email,
        document_name: doc.name,
      },
    })
    .select()
    .single();

  if (sigError) {
    return NextResponse.json({ error: sigError.message }, { status: 400 });
  }

  // Update document signed_at
  await supabase
    .from("documents")
    .update({ signed_at: signedAt })
    .eq("id", id);

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "sign_document",
    resource_type: "document",
    resource_id: id,
    details: { signature_hash: signatureHash, method: "simple", document_name: doc.name },
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  return NextResponse.json(signature, { status: 201 });
}
