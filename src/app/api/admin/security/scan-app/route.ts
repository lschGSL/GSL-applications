import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanAppSecurity } from "@/lib/security/helpers";

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
  const { appId, url } = body as { appId: string; url?: string };
  if (!appId) return NextResponse.json({ error: "Missing appId" }, { status: 400 });

  const { data: app } = await supabase
    .from("applications")
    .select("id, name, url, health_check_url")
    .eq("id", appId)
    .single();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const target = url || app.health_check_url || app.url;
  const scan = await scanAppSecurity(target);

  await supabase
    .from("applications")
    .update({
      security_status: scan.status,
      last_security_scan: new Date().toISOString(),
    })
    .eq("id", appId);

  if (scan.status === "public") {
    await supabase.from("security_events").insert({
      event_type: "suspicious_access",
      app_id: appId,
      severity: "high",
      title: `Application "${app.name}" is publicly accessible`,
      description: `Security scan returned HTTP ${scan.httpStatus} without auth redirect.`,
      metadata: { scan },
    });
  }

  return NextResponse.json({
    status: scan.status,
    details: scan,
    scannedAt: new Date().toISOString(),
  });
}
