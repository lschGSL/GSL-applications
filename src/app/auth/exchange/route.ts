import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { consumeSsoCode } from "@/lib/sso/exchange";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // New flow: opaque one-time code, tokens fetched server-side.
  // Legacy flow (still accepted for backwards compatibility): tokens
  // passed verbatim in the URL.
  const code = searchParams.get("code");
  let accessToken: string | null;
  let refreshToken: string | null;

  if (code) {
    const result = await consumeSsoCode(code);
    if (!result.ok) {
      return NextResponse.redirect(
        `${origin}/login?message=Invalid or expired SSO code`
      );
    }
    accessToken = result.access_token;
    refreshToken = result.refresh_token;
  } else {
    accessToken = searchParams.get("access_token");
    refreshToken = searchParams.get("refresh_token");
  }

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(
      `${origin}/login?message=Missing authentication tokens`
    );
  }

  const redirectUrl = `${origin}/dashboard`;
  const response = NextResponse.redirect(redirectUrl);

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

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?message=Could not authenticate`
    );
  }

  return response;
}
