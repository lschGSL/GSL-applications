import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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
  const { sessionId, userId, appSlug } = body as {
    sessionId?: string;
    userId?: string;
    appSlug?: string | null;
  };

  const service = await createServiceClient();
  let updateQuery = service
    .from("active_sessions")
    .update({ terminated_at: new Date().toISOString() });

  if (sessionId) {
    updateQuery = updateQuery.eq("id", sessionId);
  } else if (userId) {
    updateQuery = updateQuery.eq("user_id", userId);
    if (appSlug === null) updateQuery = updateQuery.is("app_slug", null);
    else if (appSlug) updateQuery = updateQuery.eq("app_slug", appSlug);
  } else {
    return NextResponse.json({ error: "Missing sessionId or userId" }, { status: 400 });
  }

  const { error } = await updateQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: sign out Supabase session (portal only — external apps keep their own).
  if (userId && !appSlug) {
    try {
      await service.auth.admin.signOut(userId, "global");
    } catch {
      // ignore — not fatal
    }
  }

  await supabase.from("security_events").insert({
    event_type: "admin_action",
    user_id: userId ?? null,
    severity: "medium",
    title: "Session terminated by admin",
    description: `Admin ${profile.role} terminated session${appSlug ? ` for app ${appSlug}` : ""}.`,
    metadata: { sessionId, userId, appSlug, terminatedBy: user.id },
  });

  return NextResponse.json({ success: true });
}
