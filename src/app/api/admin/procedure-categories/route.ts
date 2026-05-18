import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
    .from("procedure_categories")
    .select("*")
    .order("sort_order", { ascending: true });

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
  const { slug, name, icon, sort_order, published, placeholder } = body as {
    slug?: string;
    name?: string;
    icon?: string | null;
    sort_order?: number;
    published?: boolean;
    placeholder?: string | null;
  };

  if (!slug?.trim() || !name?.trim()) {
    return NextResponse.json(
      { error: "Le slug et le nom sont obligatoires." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("procedure_categories")
    .insert({
      slug: slug.trim(),
      name: name.trim(),
      icon: icon?.trim() || null,
      sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      published: published ?? false,
      placeholder: placeholder?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    // 23505 = violation de contrainte unique (slug)
    const status = error.code === "23505" ? 409 : 400;
    const message =
      error.code === "23505"
        ? `Le slug « ${slug.trim()} » existe déjà.`
        : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "create",
    resource_type: "procedure_category",
    resource_id: data.id,
    details: { slug: data.slug, name: data.name },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json(data, { status: 201 });
}
