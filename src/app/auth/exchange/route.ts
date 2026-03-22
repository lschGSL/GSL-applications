import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  console.log("[auth/exchange] hit - origin:", origin);
  console.log("[auth/exchange] access_token present:", !!accessToken);
  console.log("[auth/exchange] refresh_token present:", !!refreshToken);

  if (!accessToken || !refreshToken) {
    console.log("[auth/exchange] MISSING TOKENS - redirecting to login");
    return NextResponse.redirect(
      `${origin}/login?message=Missing authentication tokens`
    );
  }

  // Create the redirect response FIRST so we can set cookies on it
  const redirectUrl = `${origin}/dashboard`;
  const response = NextResponse.redirect(redirectUrl);

  // Create a Supabase client that writes cookies directly onto the redirect response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  console.log(
    "[auth/exchange] setSession result - user:",
    data?.user?.email ?? "null"
  );
  console.log("[auth/exchange] setSession error:", error?.message ?? "none");

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?message=Could not authenticate`
    );
  }

  // Return the response that carries the auth cookies
  return response;
}
