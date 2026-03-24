import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedRedirect } from "@/lib/utils";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const redirectUrl = isAllowedRedirect(next) ? next : `${origin}${next}`;

  if (code || (token_hash && type)) {
    // Build the redirect response first so we can write cookies directly onto it
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    let error: Error | null = null;

    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      error = result.error;
    } else if (token_hash && type) {
      const result = await supabase.auth.verifyOtp({ token_hash, type });
      error = result.error;
    }

    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Could not authenticate`);
}
