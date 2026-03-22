import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  console.log("[auth/exchange] hit - origin:", origin);
  console.log("[auth/exchange] access_token present:", !!accessToken);
  console.log("[auth/exchange] refresh_token present:", !!refreshToken);

  if (!accessToken || !refreshToken) {
    console.log("[auth/exchange] MISSING TOKENS - redirecting to login");
    return NextResponse.redirect(`${origin}/login?message=Missing authentication tokens`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  console.log("[auth/exchange] setSession result - user:", data?.user?.email ?? "null");
  console.log("[auth/exchange] setSession error:", error?.message ?? "none");

  if (error) {
    return NextResponse.redirect(`${origin}/login?message=Could not authenticate`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
