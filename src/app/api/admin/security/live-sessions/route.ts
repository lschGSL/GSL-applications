import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_THRESHOLDS, formatDuration } from "@/lib/security/helpers";

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

  const liveWindow = new Date(
    Date.now() - SECURITY_THRESHOLDS.ACTIVE_SESSION_WINDOW_MIN * 60 * 1000
  ).toISOString();

  const { data: sessions } = await supabase
    .from("active_sessions")
    .select("id, user_id, app_slug, ip_address, geo_location, started_at, last_activity, user_agent, profiles:user_id (full_name, email, avatar_url)")
    .is("terminated_at", null)
    .gte("last_activity", liveWindow)
    .order("last_activity", { ascending: false });

  const slugs = Array.from(new Set((sessions ?? []).map((s) => s.app_slug).filter(Boolean))) as string[];
  const appMap = new Map<string, { name: string; slug: string; icon_url: string | null }>();
  if (slugs.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("name, slug, icon_url")
      .in("slug", slugs);
    apps?.forEach((a) => appMap.set(a.slug, a));
  }

  const result = (sessions ?? []).map((s) => {
    const p = s.profiles as { full_name: string | null; email: string; avatar_url: string | null } | { full_name: string | null; email: string; avatar_url: string | null }[] | null;
    const profile = Array.isArray(p) ? p[0] : p;
    const app = s.app_slug ? appMap.get(s.app_slug) ?? null : null;
    return {
      id: s.id,
      user: {
        id: s.user_id,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        avatar: profile?.avatar_url ?? null,
      },
      app: app
        ? { name: app.name, slug: app.slug, icon: app.icon_url }
        : null,
      ip: s.ip_address ?? null,
      location: s.geo_location ?? null,
      duration: formatDuration(s.started_at),
      startedAt: s.started_at,
      lastActivity: s.last_activity,
      userAgent: s.user_agent ?? null,
      isLive:
        Date.now() - new Date(s.last_activity).getTime() < 5 * 60 * 1000,
    };
  });

  return NextResponse.json({ sessions: result });
}
