import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  PROCEDURE_CATEGORIES,
  PROCEDURE_STATUSES,
  type ProcedureCategory,
  type ProcedureStatus,
} from "@/types/procedures";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

export async function GET() {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("procedures")
    .select("*")
    .order("number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await verifyAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    number,
    slug,
    title,
    category,
    summary,
    content,
    version,
    owner,
    status,
  } = body as {
    number?: string;
    slug?: string;
    title?: string;
    category?: ProcedureCategory;
    summary?: string | null;
    content?: string;
    version?: string;
    owner?: string | null;
    status?: ProcedureStatus;
  };

  if (!number || !slug || !title || !category) {
    return NextResponse.json(
      { error: "Number, slug, title and category are required" },
      { status: 400 },
    );
  }

  if (!PROCEDURE_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (status && !PROCEDURE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("procedures")
    .insert({
      number,
      slug,
      title,
      category,
      summary: summary || null,
      content: content ?? "",
      version: version || "1.0",
      owner: owner || null,
      status: status || "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "create",
    resource_type: "procedure",
    resource_id: data.id,
    details: { number, slug, title, status: data.status },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json(data, { status: 201 });
}
