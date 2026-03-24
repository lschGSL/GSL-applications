"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function enrollMFA() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "GSL Portal TOTP",
  });

  if (error) return { error: error.message };

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

export async function verifyAndActivateMFA(factorId: string, code: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });

  if (error) return { error: error.message };

  // Log MFA enrollment
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "mfa_enroll",
    resource_type: "auth",
    details: { factor_id: factorId },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return { success: true };
}

export async function verifyMFACode(code: string) {
  const supabase = await createClient();

  const { data: factors, error: factorError } =
    await supabase.auth.mfa.listFactors();

  if (factorError) return { error: factorError.message };

  const totpFactor = factors.totp?.[0];
  if (!totpFactor) return { error: "No TOTP factor found" };

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: totpFactor.id,
    code,
  });

  if (error) return { error: "Invalid verification code" };

  return { success: true };
}

export async function unenrollMFA(factorId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.auth.mfa.unenroll({ factorId });

  if (error) return { error: error.message };

  // Log MFA unenrollment
  const headersList = await headers();
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "mfa_unenroll",
    resource_type: "auth",
    details: { factor_id: factorId },
    ip_address: headersList.get("x-forwarded-for") || "unknown",
    user_agent: headersList.get("user-agent"),
  });

  return { success: true };
}

export async function getMFAStatus() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { enrolled: false, factors: [] };

  const { data: factors } = await supabase.auth.mfa.listFactors();

  const verifiedFactors =
    factors?.totp?.filter((f) => f.status === "verified") ?? [];

  return {
    enrolled: verifiedFactors.length > 0,
    factors: verifiedFactors.map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name,
      createdAt: f.created_at,
    })),
  };
}

export async function getAALLevel() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return { currentLevel: "aal1" as const, nextLevel: null };

  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
  };
}
