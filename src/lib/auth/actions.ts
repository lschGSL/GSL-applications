"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAllowedRedirect, isExternalUrl } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function signIn(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";
  const email = formData.get("email") as string;

  // Rate limit: 5 attempts per IP per 15 minutes
  const ipLimit = checkRateLimit(`signin:ip:${ip}`, 5, 15 * 60 * 1000);
  if (!ipLimit.allowed) {
    return {
      error: `Too many login attempts. Please try again in ${ipLimit.retryAfterSeconds} seconds.`,
    };
  }

  // Rate limit: 5 attempts per email per 15 minutes
  const emailLimit = checkRateLimit(`signin:email:${email}`, 5, 15 * 60 * 1000);
  if (!emailLimit.allowed) {
    return {
      error: `Too many login attempts for this account. Please try again in ${emailLimit.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user has MFA enrolled
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const hasVerifiedTOTP =
    factorsData?.totp?.some((f) => f.status === "verified") ?? false;

  // Log the sign-in
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "sign_in",
      resource_type: "auth",
      ip_address: ip,
      user_agent: headersList.get("user-agent"),
    });
  }

  // If MFA is enrolled, redirect to verification page
  if (hasVerifiedTOTP) {
    const redirectTo = formData.get("redirect") as string;
    const mfaRedirect = redirectTo
      ? `/mfa-verify?redirect=${encodeURIComponent(redirectTo)}`
      : "/mfa-verify";
    redirect(mfaRedirect);
  }

  const redirectTo = formData.get("redirect") as string;

  // External redirect: return the URL to the client for window.location redirect
  if (redirectTo && isExternalUrl(redirectTo)) {
    if (isAllowedRedirect(redirectTo)) {
      return { redirectTo };
    }
    // Invalid external domain — fall back to dashboard
    redirect("/dashboard");
  }

  redirect(redirectTo || "/dashboard");
}

export async function signUp(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  // Rate limit: 3 sign-ups per IP per 15 minutes
  const limit = checkRateLimit(`signup:ip:${ip}`, 3, 15 * 60 * 1000);
  if (!limit.allowed) {
    return {
      error: `Too many registration attempts. Please try again in ${limit.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Check your email to confirm your account");
}

export async function signOut() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const headersList = await headers();
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "sign_out",
      resource_type: "auth",
      ip_address: headersList.get("x-forwarded-for") || "unknown",
      user_agent: headersList.get("user-agent"),
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPassword(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  // Rate limit: 3 requests per IP per 15 minutes
  const limit = checkRateLimit(`forgot:ip:${ip}`, 3, 15 * 60 * 1000);
  if (!limit.allowed) {
    return {
      error: `Too many requests. Please try again in ${limit.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();

  // Build the redirect URL from the request headers so it works
  // regardless of whether NEXT_PUBLIC_APP_URL is configured.
  const host = headersList.get("host") ?? "gsl-applications.vercel.app";
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const appUrl = `${proto}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    { redirectTo: `${appUrl}/auth/callback?next=/reset-password` }
  );

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email for a password reset link" };
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
