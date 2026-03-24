import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/mfa-verify", "/auth/callback", "/auth/exchange"];

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

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath && request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (but allow /auth/exchange, /reset-password, and /mfa-verify)
  if (user && isPublicPath && !request.nextUrl.pathname.startsWith("/auth/exchange") && !request.nextUrl.pathname.startsWith("/reset-password") && !request.nextUrl.pathname.startsWith("/mfa-verify")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
