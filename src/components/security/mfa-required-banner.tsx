"use client";

import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function MfaRequiredBanner() {
  const { t } = useI18n();

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-4"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">
            {t("mfa.requiredTitle")}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-500/80 mt-1">
            {t("mfa.requiredDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
