"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function OpenAppButton({ slug, url }: { slug: string; url: string }) {
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
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

      // If SSO could not be initiated (no session, no access, etc.),
      // fall back to opening the app directly — it will redirect to
      // its own login.
      window.open(fullUrl, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className="w-full" onClick={handleClick} disabled={loading}>
      {t("apps.openApplication")}
      {loading ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <ExternalLink className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
