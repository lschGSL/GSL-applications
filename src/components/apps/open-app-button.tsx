"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function OpenAppButton({ url }: { url: string }) {
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;

  const handleClick = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const authUrl = new URL("/auth/exchange", fullUrl);
      authUrl.searchParams.set("access_token", session.access_token);
      authUrl.searchParams.set("refresh_token", session.refresh_token);
      window.open(authUrl.toString(), "_blank", "noopener,noreferrer");
    } else {
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Button className="w-full" onClick={handleClick}>
      Open Application <ExternalLink className="ml-2 h-4 w-4" />
    </Button>
  );
}
