import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const CODE_TTL_MS = 60 * 1000; // 60 seconds, mirrors the SQL default

// Mint a one-time SSO exchange code so the user can be SSO-redirected
// to a satellite app without ever exposing their access/refresh tokens
// in the URL. The portal stores the tokens server-side keyed by the
// code; the satellite swaps the code for the tokens back-channel via
// /api/auth/sso/exchange.
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // We need the live session (access + refresh tokens) to stash them
  // for the satellite. getUser() does not return them, so getSession()
  // is required here.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { app_slug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const appSlug = typeof body.app_slug === "string" ? body.app_slug : "";
  if (!appSlug) {
    return NextResponse.json({ error: "Missing app_slug" }, { status: 400 });
  }

  // Resolve the app from the registry (NOT from the client) so the
  // redirect target cannot be spoofed.
  const { data: app } = await supabase
    .from("applications")
    .select("id, slug, url, is_active")
    .eq("slug", appSlug)
    .maybeSingle();

  if (!app || !app.is_active) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Admins/managers see all apps in the UI, so they should be able to
  // open them too. Everyone else needs an explicit app_access row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin =
    profile?.role === "admin" || profile?.role === "manager";

  if (!isAdmin) {
    const { data: access } = await supabase
      .from("app_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("app_id", app.id)
      .maybeSingle();
    if (!access) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const fullAppUrl = app.url.startsWith("http") ? app.url : `https://${app.url}`;
  const targetUrl = `${fullAppUrl.replace(/\/$/, "")}/auth/exchange`;

  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  const serviceClient = await createServiceClient();
  const { error: insertError } = await serviceClient
    .from("sso_exchange_codes")
    .insert({
      code,
      user_id: user.id,
      app_slug: app.slug,
      target_url: targetUrl,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: expiresAt,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Could not initiate SSO" },
      { status: 500 }
    );
  }

  const headersList = await headers();
  await serviceClient.from("audit_logs").insert({
    user_id: user.id,
    action: "sso_initiate",
    resource_type: "auth",
    details: { app_slug: app.slug },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return NextResponse.json({
    redirect_url: `${targetUrl}?code=${code}`,
  });
}
