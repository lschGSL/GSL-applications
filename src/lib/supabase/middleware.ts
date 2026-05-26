import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/mfa-verify", "/welcome", "/auth/callback", "/auth/exchange", "/api/invitations"];

const MFA_REQUIRED_ROLES = ["admin", "manager"] as const;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, allow all requests through
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Supabase may redirect auth codes to / when redirect URLs are not whitelisted.
  // Forward them to /auth/callback so the code gets properly exchanged.
  if (request.nextUrl.pathname === "/") {
    const code = request.nextUrl.searchParams.get("code");
    const token_hash = request.nextUrl.searchParams.get("token_hash");
    if (code || token_hash) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/callback";
      return NextResponse.redirect(url);
    }
  }

  // Handle Supabase auth errors (e.g. expired reset link redirected to /)
  const errorCode = request.nextUrl.searchParams.get("error_code");
  if (errorCode && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (errorCode === "otp_expired") {
      url.searchParams.set("message", "Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.");
    } else {
      url.searchParams.set("message", "Une erreur est survenue. Veuillez réessayer.");
    }
    return NextResponse.redirect(url);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect unauthenticated users to login (including /)
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (request.nextUrl.pathname !== "/") {
      url.searchParams.set("redirect", request.nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users on / to dashboard
  if (user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (but allow /auth/exchange, /reset-password, and /mfa-verify)
  if (user && isPublicPath && !request.nextUrl.pathname.startsWith("/auth/exchange") && !request.nextUrl.pathname.startsWith("/reset-password") && !request.nextUrl.pathname.startsWith("/welcome") && !request.nextUrl.pathname.startsWith("/mfa-verify")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Enforce MFA for sensitive roles (admin, manager).
  // If they have no verified TOTP factor, force them through /settings/security
  // before letting them access the rest of the portal.
  if (user && !isPublicPath) {
    const pathname = request.nextUrl.pathname;
    const isMfaExempt =
      pathname.startsWith("/api/") ||
      pathname === "/settings" ||
      pathname.startsWith("/settings/") ||
      pathname.startsWith("/auth/exchange") ||
      pathname.startsWith("/auth/callback") ||
      pathname.startsWith("/mfa-verify");

    if (!isMfaExempt) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profileRow?.role;
      if (role && (MFA_REQUIRED_ROLES as readonly string[]).includes(role)) {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const hasVerifiedTotp =
          factorsData?.totp?.some((f) => f.status === "verified") ?? false;

        if (!hasVerifiedTotp) {
          const url = request.nextUrl.clone();
          url.pathname = "/settings/security";
          url.search = "";
          url.searchParams.set("mfa_required", "true");
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}
