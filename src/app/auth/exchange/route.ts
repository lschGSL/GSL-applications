import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { consumeSsoCode } from "@/lib/sso/exchange";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?message=Missing SSO code`
    );
  }

  const result = await consumeSsoCode(code);
  if (!result.ok) {
    return NextResponse.redirect(
      `${origin}/login?message=Invalid or expired SSO code`
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
    access_token: result.access_token,
    refresh_token: result.refresh_token,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?message=Could not authenticate`
    );
  }

  return response;
}
