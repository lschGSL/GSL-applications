import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedRedirect } from "@/lib/utils";
import type { EmailOtpType, Session } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (code || (token_hash && type)) {
    const defaultNext = next ?? "/dashboard";
    const defaultRedirectUrl = isAllowedRedirect(defaultNext)
      ? defaultNext
      : `${origin}${defaultNext}`;
    const response = NextResponse.redirect(defaultRedirectUrl);

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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    let error: Error | null = null;
    let session: Session | null = null;

    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      error = result.error;
      session = result.data?.session ?? null;
    } else if (token_hash && type) {
      const result = await supabase.auth.verifyOtp({ token_hash, type });
      error = result.error;
      session = result.data?.session ?? null;
    }

    if (!error) {
      // If no explicit `next` was provided (Supabase stripped the redirect),
      // detect password-recovery sessions and redirect to /reset-password.
      if (!next && session?.user?.recovery_sent_at) {
        const recoverySentAt = new Date(
          session.user.recovery_sent_at
        ).getTime();
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        if (recoverySentAt > twoHoursAgo) {
          const recoveryResponse = NextResponse.redirect(
            `${origin}/reset-password`
          );
          response.cookies.getAll().forEach((cookie) => {
            recoveryResponse.cookies.set(cookie.name, cookie.value);
          });
          return recoveryResponse;
        }
      }
      return response;
    }
  }

  return NextResponse.redirect(
    `${origin}/login?message=Could not authenticate`
  );
}
