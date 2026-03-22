import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  const { data: apps, error } = await supabase
    .from("applications")
    .select("name, slug, url, is_active");

  return NextResponse.json({
    user: user?.user?.email ?? null,
    apps: apps ?? [],
    error: error?.message ?? null,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "not set",
    },
  });
}
