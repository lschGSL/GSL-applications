"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { LayoutGrid, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

export type ViewMode = "list" | "grouped";

/**
 * Toggle list / grouped pour les pages procedures, decisions, formations.
 * Synchronisé via ?view=grouped dans l'URL (absent ou "list" = liste).
 */
export function ViewToggle({
  paramName = "view",
  current,
  className,
}: {
  paramName?: string;
  current: ViewMode;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const setMode = useCallback(
    (mode: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "grouped") {
        params.set(paramName, "grouped");
      } else {
        params.delete(paramName);
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams, paramName],
  );

  return (
    <div
      role="radiogroup"
      aria-label={t("domains.view.ariaLabel")}
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-background p-0.5",
        isPending && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={current === "list"}
        onClick={() => setMode("list")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
          current === "list"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutList className="h-3.5 w-3.5" />
        {t("domains.view.list")}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={current === "grouped"}
        onClick={() => setMode("grouped")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
          current === "grouped"
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {t("domains.view.grouped")}
      </button>
    </div>
  );
}
