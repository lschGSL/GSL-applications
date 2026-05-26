"use client";

import { useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, ExternalLink, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function AppCard({
  slug,
  name,
  description,
  url,
  iconUrl,
}: {
  slug: string;
  name: string;
  description: string;
  url: string;
  iconUrl?: string | null;
}) {
  const fullUrl = url && url.trim() ? (url.startsWith("http") ? url : `https://${url}`) : "";
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!fullUrl || !slug || loading) return;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sso/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_slug: slug }),
      });

      if (response.ok) {
        const { redirect_url } = (await response.json()) as {
          redirect_url: string;
        };
        window.open(redirect_url, "_blank", "noopener,noreferrer");
        return;
      }

      // Fallback: open the satellite directly; it will redirect to its
      // own login flow if necessary.
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
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
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                fullUrl && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
            {!fullUrl && (
              <p className="text-xs text-muted-foreground mt-1">{t("apps.urlNotConfigured")}</p>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
