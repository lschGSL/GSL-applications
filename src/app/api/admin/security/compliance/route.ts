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

  const now = new Date();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const last90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [usersResult, mfaResult, accessReviewResult, sessionsResult, auditResult] =
    await Promise.all([
      supabase.from("profiles").select("id, role", { count: "exact" }).eq("is_active", true),
      supabase
        .from("audit_logs")
        .select("user_id")
        .eq("action", "mfa_enroll")
        .gte("created_at", last90d),
      supabase
        .from("audit_logs")
        .select("user_id, created_at")
        .eq("action", "user_review")
        .gte("created_at", last90d),
      supabase
        .from("active_sessions")
        .select("started_at, last_activity, terminated_at")
        .gte("started_at", last30d),
      supabase
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", last30d),
    ]);

  const totalUsers = usersResult.count ?? 0;
  const mfaUsers = new Set((mfaResult.data ?? []).map((r) => r.user_id)).size;
  const mfaRate = totalUsers > 0 ? Math.round((mfaUsers / totalUsers) * 100) : 0;

  const reviewedUserIds = new Set((accessReviewResult.data ?? []).map((r) => r.user_id));
  const usersWithReview = Array.from(reviewedUserIds).length;
  const overdueReviews = Math.max(0, totalUsers - usersWithReview);

  // Session compliance: sessions longer than SESSION_DURATION_MAX_HOURS.
  let compliantSessions = 0;
  let totalSessionMinutes = 0;
  const totalSessions = sessionsResult.data?.length ?? 0;
  sessionsResult.data?.forEach((s) => {
    const end = s.terminated_at ? new Date(s.terminated_at) : new Date(s.last_activity);
    const minutes = (end.getTime() - new Date(s.started_at).getTime()) / 60_000;
    totalSessionMinutes += minutes;
    if (minutes <= SECURITY_THRESHOLDS.SESSION_DURATION_MAX_HOURS * 60) compliantSessions++;
  });
  const avgSessionMinutes =
    totalSessions > 0 ? Math.round(totalSessionMinutes / totalSessions) : 0;
  const sessionTimeoutCompliantRate =
    totalSessions > 0 ? Math.round((compliantSessions / totalSessions) * 100) : 100;

  const auditCoverage = (auditResult.count ?? 0) > 0 ? 100 : 0;

  return NextResponse.json({
    userAccessReviews: {
      reviewed: usersWithReview,
      overdue: overdueReviews,
      total: totalUsers,
    },
    mfaAdoptionRate: mfaRate,
    sessionCompliance: {
      avgLengthMinutes: avgSessionMinutes,
      timeoutCompliantRate: sessionTimeoutCompliantRate,
      totalSessions,
    },
    auditLogCoverage: auditCoverage,
    thresholds: SECURITY_THRESHOLDS,
  });
}
