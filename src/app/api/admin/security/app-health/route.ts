import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_THRESHOLDS } from "@/lib/security/helpers";

export async function GET() {
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

  const { data: apps } = await supabase
    .from("applications")
    .select("id, name, slug, url, icon_url, security_status, last_security_scan, health_check_url, is_active")
    .order("name");

  const liveWindow = new Date(
    Date.now() - SECURITY_THRESHOLDS.ACTIVE_SESSION_WINDOW_MIN * 60 * 1000
  ).toISOString();
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [activeBySlug, errorsBySlug] = await Promise.all([
    supabase
      .from("active_sessions")
      .select("app_slug")
      .is("terminated_at", null)
      .gte("last_activity", liveWindow),
    supabase
      .from("security_events")
      .select("app_id, event_type")
      .in("event_type", ["failed_auth", "app_error"])
      .gte("created_at", last24h),
  ]);

  const activeCount = new Map<string, number>();
  activeBySlug.data?.forEach((s) => {
    if (!s.app_slug) return;
    activeCount.set(s.app_slug, (activeCount.get(s.app_slug) ?? 0) + 1);
  });

  const errorCount = new Map<string, number>();
  errorsBySlug.data?.forEach((e) => {
    if (!e.app_id) return;
    errorCount.set(e.app_id, (errorCount.get(e.app_id) ?? 0) + 1);
  });

  const result = (apps ?? []).map((a) => {
    const active = activeCount.get(a.slug) ?? 0;
    const errors = errorCount.get(a.id) ?? 0;
    const errorRate = active + errors > 0 ? (errors / (active + errors)) * 100 : 0;
    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      url: a.url,
      icon: a.icon_url,
      securityStatus: a.security_status ?? "unknown",
      lastSecurityScan: a.last_security_scan,
      isActive: a.is_active,
      activeUsers: active,
      errorCount24h: errors,
      errorRate: Math.round(errorRate * 10) / 10,
    };
  });

  return NextResponse.json({ applications: result });
}
