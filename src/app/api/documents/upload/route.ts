import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { webhookDocumentUploaded } from "@/lib/webhooks";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "image/png",
  "image/jpeg",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("client_id") as string;
  const folderId = (formData.get("folder_id") as string) || null;
  const docName = (formData.get("name") as string) || file?.name || "Untitled";

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  // Permission check: clients can only upload for themselves
  if (profile.role === "client" && clientId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Members/viewers cannot upload
  if (!["admin", "manager", "client"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Accepted: PDF, Excel, PNG, JPEG" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum: 50MB" },
      { status: 400 }
    );
  }

  // Build storage path
  const fileExt = file.name.split(".").pop() || "bin";
  const storagePath = `${clientId}/${folderId || "root"}/${crypto.randomUUID()}.${fileExt}`;

  // Upload to Supabase Storage using service client
  const serviceClient = await createServiceClient();
  const { error: uploadError } = await serviceClient.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed: " + uploadError.message },
      { status: 500 }
    );
  }

  // Insert document record
  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      name: docName,
      file_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      client_id: clientId,
      uploaded_by: user.id,
      folder_id: folderId,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    // Cleanup uploaded file
    await serviceClient.storage.from("documents").remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // Audit log
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "upload_document",
    resource_type: "document",
    resource_id: doc.id,
    details: { name: docName, client_id: clientId, file_size: file.size, mime_type: file.type },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  // Webhook
  const { data: uploader } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();
  webhookDocumentUploaded(uploader?.full_name || uploader?.email || "Unknown", docName).catch(() => {});

  return NextResponse.json(doc, { status: 201 });
}
