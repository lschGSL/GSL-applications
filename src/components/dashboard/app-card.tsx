"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AppCard({
  name,
  description,
  url,
  iconUrl,
}: {
  name: string;
  description: string;
  url: string;
  iconUrl?: string | null;
}) {
  const fullUrl = url && url.trim() ? (url.startsWith("http") ? url : `https://${url}`) : "";

  const handleClick = async () => {
    if (!fullUrl) return;

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
    <Card
      className={`hover:shadow-md transition-shadow h-full ${fullUrl ? "cursor-pointer" : "cursor-default opacity-75"}`}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
            {iconUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={iconUrl} alt="" className="h-10 w-10 object-cover rounded-lg" />
            ) : (
              <LayoutGrid className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base flex items-center gap-1.5">
              {name}
              {fullUrl && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
            {!fullUrl && (
              <p className="text-xs text-muted-foreground mt-1">URL not configured</p>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
