import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedRedirect } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Support external redirects to allowed domains
      if (isAllowedRedirect(next)) {
        return NextResponse.redirect(next);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Could not authenticate`);
}
