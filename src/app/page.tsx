import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing-content";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  // Supabase sends auth codes to / when redirect URLs are not whitelisted.
  // Forward to /auth/callback so the code is properly exchanged.
  if (params.code) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
    redirect(`/auth/callback?${qs.toString()}`);
  }

  return <LandingContent />;
}
