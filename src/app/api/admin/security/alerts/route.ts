import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(10, parseInt(params.get("pageSize") ?? "25")));
  const severity = params.get("severity");
  const type = params.get("type");
  const onlyUnresolved = params.get("unresolved") === "true";

  let query = supabase
    .from("security_events")
    .select(
      "id, event_type, severity, title, description, user_id, app_id, created_at, resolved, metadata, ip_address, geo_location, profiles:user_id (full_name, email), applications:app_id (name, slug)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (severity && severity !== "all") query = query.eq("severity", severity);
  if (type && type !== "all") query = query.eq("event_type", type);
  if (onlyUnresolved) query = query.eq("resolved", false);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count } = await query.range(from, to);

  const alerts = (data ?? []).map((e) => {
    const u = e.profiles as { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
    const user = Array.isArray(u) ? u[0] : u;
    const a = e.applications as { name: string; slug: string } | { name: string; slug: string }[] | null;
    const app = Array.isArray(a) ? a[0] : a;
    return {
      id: e.id,
      type: e.event_type,
      severity: e.severity,
      title: e.title,
      description: e.description,
      timestamp: e.created_at,
      resolved: e.resolved,
      user: user ? { name: user.full_name, email: user.email } : null,
      app: app ? { name: app.name, slug: app.slug } : null,
      ip: e.ip_address,
      location: e.geo_location,
      metadata: e.metadata,
    };
  });

  return NextResponse.json({
    alerts,
    pagination: {
      page,
      pageSize,
      totalItems: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, resolved } = body as { id: string; resolved: boolean };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase
    .from("security_events")
    .update({
      resolved,
      resolved_by: resolved ? user.id : null,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
