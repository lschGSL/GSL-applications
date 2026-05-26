import { createServiceClient } from "@/lib/supabase/server";

export type SsoExchangeSuccess = {
  ok: true;
  user_id: string;
  app_slug: string;
  target_url: string;
  access_token: string;
  refresh_token: string;
};

export type SsoExchangeFailure = {
  ok: false;
  // We collapse "not found", "already used", "expired" into a single
  // `invalid` reason on purpose: leaking which one failed would let an
  // attacker fingerprint codes.
  reason: "invalid" | "internal";
};

export type SsoExchangeResult = SsoExchangeSuccess | SsoExchangeFailure;

/**
 * Atomically consume an SSO exchange code: mark it used and return the
 * stored tokens. Uses Postgres row-level locking via a conditional
 * UPDATE so two concurrent calls cannot both succeed.
 */
export async function consumeSsoCode(code: string): Promise<SsoExchangeResult> {
  if (typeof code !== "string" || code.length < 32) {
    return { ok: false, reason: "invalid" };
  }

  try {
    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from("sso_exchange_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("code", code)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("user_id, app_slug, target_url, access_token, refresh_token")
      .maybeSingle();

    if (error) {
      return { ok: false, reason: "internal" };
    }
    if (!data) {
      return { ok: false, reason: "invalid" };
    }

    return {
      ok: true,
      user_id: data.user_id,
      app_slug: data.app_slug,
      target_url: data.target_url,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  } catch {
    return { ok: false, reason: "internal" };
  }
}
