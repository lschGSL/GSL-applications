"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function OpenAppButton({ url }: { url: string }) {
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;

  const handleClick = async () => {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    console.log("[OpenAppButton] target url:", fullUrl);
    console.log("[OpenAppButton] session exists:", !!session);
    console.log("[OpenAppButton] session error:", error);
    if (session) {
      console.log("[OpenAppButton] access_token present:", !!session.access_token);
      console.log("[OpenAppButton] refresh_token present:", !!session.refresh_token);
      const authUrl = new URL("/auth/exchange", fullUrl);
      authUrl.searchParams.set("access_token", session.access_token);
      authUrl.searchParams.set("refresh_token", session.refresh_token);
      console.log("[OpenAppButton] opening:", authUrl.toString().replace(/access_token=[^&]+/, "access_token=***").replace(/refresh_token=[^&]+/, "refresh_token=***"));
      window.open(authUrl.toString(), "_blank", "noopener,noreferrer");
    } else {
      console.log("[OpenAppButton] NO SESSION - opening without tokens:", fullUrl);
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Button className="w-full" onClick={handleClick}>
      Open Application <ExternalLink className="ml-2 h-4 w-4" />
    </Button>
  );
}
