import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { consumeSsoCode } from "@/lib/sso/exchange";
import { checkRateLimit } from "@/lib/rate-limit";

// Back-channel SSO exchange.
//
// Satellite apps POST { code } to this endpoint from their own server
// (no portal session cookies involved). The portal validates the
// one-time code and returns the Supabase access/refresh tokens that
// were stashed when the code was minted.
//
// Errors are intentionally vague (single 400 for any reason) to avoid
// fingerprinting which codes are valid-but-used vs expired vs unknown.
export async function POST(request: NextRequest) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  // 10 exchanges per IP per minute — these calls come from satellite
  // servers, so volume should be modest.
  const limit = await checkRateLimit(`sso-exchange:ip:${ip}`, 10, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  let payload: { code?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = typeof payload.code === "string" ? payload.code : "";
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const result = await consumeSsoCode(code);
  if (!result.ok) {
    const status = result.reason === "internal" ? 500 : 400;
    return NextResponse.json(
      { error: result.reason === "internal" ? "Internal error" : "Invalid or expired code" },
      { status }
    );
  }

  // Audit the successful exchange. Best-effort: if logging fails we
  // still return the tokens — the caller is already authorised by the
  // code itself.
  try {
    const serviceClient = await createServiceClient();
    await serviceClient.from("audit_logs").insert({
      user_id: result.user_id,
      action: "sso_exchange",
      resource_type: "auth",
      details: { app_slug: result.app_slug, user_id: result.user_id },
      ip_address: ip,
      user_agent: headersList.get("user-agent"),
    });
  } catch {
    // ignore
  }

  return NextResponse.json({
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    target_url: result.target_url,
  });
}
