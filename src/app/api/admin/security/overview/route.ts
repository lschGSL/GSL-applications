import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SECURITY_THRESHOLDS } from "@/lib/security/helpers";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { supabase } = auth;

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const liveWindow = new Date(
    now.getTime() - SECURITY_THRESHOLDS.ACTIVE_SESSION_WINDOW_MIN * 60 * 1000
  ).toISOString();

  const [
    activeSessionsResult,
    failedLoginsResult,
    suspiciousResult,
    totalUsersResult,
    mfaUsersResult,
    auditCoverageResult,
  ] = await Promise.all([
    supabase
      .from("active_sessions")
      .select("id", { count: "exact", head: true })
      .is("terminated_at", null)
      .gte("last_activity", liveWindow),
    supabase
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "failed_auth")
      .gte("created_at", last24h),
    supabase
      .from("security_events")
      .select("id", { count: "exact", head: true })
      .in("event_type", ["suspicious_access", "new_device"])
      .eq("resolved", false)
      .gte("created_at", last24h),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("audit_logs")
      .select("user_id", { count: "exact", head: true })
      .eq("action", "mfa_enroll")
      .gte("created_at", new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }).gte("created_at", last24h),
  ]);

  const activeSessions = activeSessionsResult.count ?? 0;
  const failedLogins24h = failedLoginsResult.count ?? 0;
  const suspiciousActivities = suspiciousResult.count ?? 0;
  const totalUsers = totalUsersResult.count ?? 0;
  const mfaUsers = Math.min(mfaUsersResult.count ?? 0, totalUsers);
  const auditCoverage = auditCoverageResult.count ?? 0;

  // Compliance score: weighted blend of MFA adoption, low failed logins, audit coverage.
  const mfaRate = totalUsers > 0 ? mfaUsers / totalUsers : 0;
  const failedPenalty = Math.min(failedLogins24h / SECURITY_THRESHOLDS.FAILED_LOGINS_24H, 1);
  const suspiciousPenalty = Math.min(
    suspiciousActivities / SECURITY_THRESHOLDS.SUSPICIOUS_ACTIVITIES,
    1
  );
  const coverageScore = auditCoverage > 0 ? 1 : 0.5;

  const complianceScore = Math.round(
    100 *
      (0.4 * mfaRate + 0.25 * (1 - failedPenalty) + 0.2 * (1 - suspiciousPenalty) + 0.15 * coverageScore)
  );

  return NextResponse.json({
    activeSessions,
    failedLogins24h,
    suspiciousActivities,
    complianceScore,
    thresholds: SECURITY_THRESHOLDS,
  });
}
