import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const period = request.nextUrl.searchParams.get("period") || "24h";
  const eventType = request.nextUrl.searchParams.get("type") || "";
  const search = request.nextUrl.searchParams.get("q") || "";
  const status = request.nextUrl.searchParams.get("status") || "";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const pageSize = 50;

  // Calculate period start
  const now = new Date();
  const periodMap: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  const periodMs = periodMap[period] || periodMap["24h"];
  const since = new Date(now.getTime() - periodMs).toISOString();
  const prevSince = new Date(now.getTime() - 2 * periodMs).toISOString();

  // Fetch app audit logs
  const { data: appLogs } = await supabase
    .from("audit_logs")
    .select(`*, profiles:user_id (email, full_name)`)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  // Fetch Supabase auth audit log via service role
  const serviceClient = await createServiceClient();
  let authEntries: Array<{
    id: string;
    payload: Record<string, unknown>;
    created_at: string;
    ip_address: string;
  }> = [];

  try {
    const { data } = await serviceClient
      .from("auth.audit_log_entries")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) authEntries = data;
  } catch {
    // auth.audit_log_entries may not be accessible — fallback to app logs only
  }

  // Fetch all profiles for enrichment
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, email, full_name");
  const profileMap = new Map<string, { email: string; full_name: string | null }>();
  allProfiles?.forEach((p) => profileMap.set(p.id, { email: p.email, full_name: p.full_name }));

  // Normalize events from both sources
  type AuthEvent = {
    id: string;
    time: string;
    type: string;
    user_id: string | null;
    user_email: string | null;
    user_name: string | null;
    ip: string | null;
    details: string | null;
    status: "success" | "failure" | "info";
    source: "app" | "auth";
  };

  const events: AuthEvent[] = [];

  // Map app audit logs
  for (const log of appLogs ?? []) {
    const p = log.profiles as { email?: string; full_name?: string } | null;
    const actionMap: Record<string, { type: string; status: "success" | "failure" | "info" }> = {
      sign_in: { type: "sign_in", status: "success" },
      sign_out: { type: "sign_out", status: "info" },
      create: { type: log.resource_type === "user" ? "user_invited" : "create", status: "info" },
      resend_invitation: { type: "user_invited", status: "info" },
      force_reset_password: { type: "force_reset_password", status: "info" },
      delete: { type: log.resource_type === "user" ? "user_deleted" : "delete", status: "info" },
      request_signatures: { type: "sign_in", status: "info" },
    };
    const mapped = actionMap[log.action] || { type: log.action, status: "info" as const };
    const details = log.details as Record<string, unknown> | null;

    events.push({
      id: log.id,
      time: log.created_at,
      type: mapped.type,
      user_id: log.user_id,
      user_email: p?.email || null,
      user_name: p?.full_name || null,
      ip: log.ip_address,
      details: details ? JSON.stringify(details) : null,
      status: mapped.status,
      source: "app",
    });
  }

  // Map Supabase auth audit entries
  for (const entry of authEntries) {
    const payload = entry.payload || {};
    const action = (payload.action as string) || "unknown";
    const userId = (payload.actor_id as string) || null;
    const p = userId ? profileMap.get(userId) : null;

    let type = action;
    let eventStatus: "success" | "failure" | "info" = "info";
    let details: string | null = null;

    if (action === "login") {
      const provider = (payload.traits as Record<string, unknown>)?.provider;
      type = "sign_in";
      eventStatus = "success";
      details = provider ? `Provider: ${provider}` : null;
    } else if (action === "login_failed" || action === "user_login_failed") {
      type = "sign_in_failed";
      eventStatus = "failure";
      details = (payload.traits as Record<string, unknown>)?.error_message as string || "Authentication failed";
    } else if (action === "logout") {
      type = "sign_out";
    } else if (action === "token_refreshed") {
      type = "token_refreshed";
    } else if (action === "user_recovery_requested") {
      type = "password_recovery";
    } else if (action === "user_invited") {
      type = "user_invited";
    }

    events.push({
      id: entry.id,
      time: entry.created_at,
      type,
      user_id: userId,
      user_email: p?.email || (payload.traits as Record<string, unknown>)?.email as string || null,
      user_name: p?.full_name || null,
      ip: entry.ip_address || null,
      details,
      status: eventStatus,
      source: "auth",
    });
  }

  // Deduplicate by id, sort by time desc
  const seen = new Set<string>();
  const unique = events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  unique.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Apply filters
  let filtered = unique;

  if (eventType) {
    const types = eventType.split(",");
    filtered = filtered.filter((e) => types.includes(e.type));
  }

  if (status === "success") {
    filtered = filtered.filter((e) => e.status === "success");
  } else if (status === "failure") {
    filtered = filtered.filter((e) => e.status === "failure");
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.user_email?.toLowerCase().includes(q) ||
        e.user_name?.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.ip?.includes(q) ||
        e.details?.toLowerCase().includes(q)
    );
  }

  // Metrics
  const totalEvents = filtered.length;
  const successCount = filtered.filter((e) => e.status === "success").length;
  const failureCount = filtered.filter((e) => e.status === "failure").length;
  const uniqueUsers = new Set(filtered.filter((e) => e.user_id).map((e) => e.user_id)).size;

  // Previous period metrics (for trends)
  const prevAppLogs = await supabase
    .from("audit_logs")
    .select("action", { count: "exact", head: true })
    .gte("created_at", prevSince)
    .lt("created_at", since);
  const prevTotal = prevAppLogs.count ?? 0;

  // Hourly activity for chart (last 24h)
  const hourlyData: { hour: string; success: number; failure: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    const hourLabel = hourStart.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const hourEvents = unique.filter((e) => {
      const t = new Date(e.time).getTime();
      return t >= hourStart.getTime() && t < hourEnd.getTime();
    });
    hourlyData.push({
      hour: hourLabel,
      success: hourEvents.filter((e) => e.status === "success").length,
      failure: hourEvents.filter((e) => e.status === "failure").length,
    });
  }

  // Alerts
  const alerts: { type: string; message: string; userId?: string; severity: "warning" | "danger" }[] = [];

  // Brute force detection: 5+ failures for same email in 30 min
  const recentFailures = unique.filter(
    (e) => e.type === "sign_in_failed" && new Date(e.time).getTime() > now.getTime() - 30 * 60 * 1000
  );
  const failuresByEmail = new Map<string, number>();
  recentFailures.forEach((e) => {
    if (e.user_email) {
      failuresByEmail.set(e.user_email, (failuresByEmail.get(e.user_email) || 0) + 1);
    }
  });
  failuresByEmail.forEach((count, email) => {
    if (count >= 5) {
      alerts.push({
        type: "brute_force",
        message: `${count} failed login attempts for ${email} in the last 30 minutes`,
        severity: "danger",
      });
    }
  });

  // Paginate
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    events: paginated,
    metrics: {
      totalEvents,
      successCount,
      failureCount,
      uniqueUsers,
      prevTotal,
    },
    hourlyData,
    alerts,
    pagination: {
      page,
      pageSize,
      totalPages,
      totalItems: filtered.length,
    },
  });
}

// Export CSV
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

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const events = body.events || [];

  const headers_row = ["Time", "User", "Email", "Event", "Details", "IP", "Status"];
  const rows = events.map((e: { time: string; user_name: string; user_email: string; type: string; details: string; ip: string; status: string }) => [
    e.time,
    e.user_name || "—",
    e.user_email || "—",
    e.type,
    (e.details || "").replace(/,/g, ";"),
    e.ip || "—",
    e.status,
  ]);

  const csv = [headers_row, ...rows]
    .map((row) => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auth-logs-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
