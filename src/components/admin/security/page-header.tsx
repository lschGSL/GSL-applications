"use client";

import { Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function SecurityPageHeader() {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">{t("security.page.title")}</h1>
      </div>
      <p className="mt-1 text-muted-foreground">{t("security.page.subtitle")}</p>
    </div>
  );
}
