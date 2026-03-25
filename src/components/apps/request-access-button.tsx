"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function RequestAccessButton({ appId, appName }: { appId: string; appName: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function handleRequest() {
    setLoading(true);
    try {
      const res = await fetch("/api/apps/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || t("apps.requestFailed"));
        return;
      }

      setSent(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Button variant="outline" className="w-full" disabled>
        <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> {t("apps.requestSent")}
      </Button>
    );
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleRequest} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Lock className="mr-2 h-4 w-4" />
      )}
      {t("apps.requestAccess")}
    </Button>
  );
}
