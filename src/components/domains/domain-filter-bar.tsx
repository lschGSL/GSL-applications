"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { Domain, DomainColor } from "@/types/database";

type CountField = "procedure_count" | "decision_count" | "formation_count" | "total_count";

// Tailwind a besoin de classes statiques (pas de classes concaténées).
const CHIP_INACTIVE: Record<DomainColor, string> = {
  blue: "border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-300",
  green:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300",
  amber:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300",
  purple:
    "border-purple-500/20 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-300",
  teal: "border-teal-500/20 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-300",
  coral:
    "border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300",
  pink: "border-pink-500/20 bg-pink-500/10 text-pink-700 hover:bg-pink-500/20 dark:text-pink-300",
  gray: "border-gray-500/20 bg-gray-500/10 text-gray-700 hover:bg-gray-500/20 dark:text-gray-300",
};

const CHIP_ACTIVE: Record<DomainColor, string> = {
  blue: "border-blue-500 bg-blue-500 text-white",
  green: "border-emerald-500 bg-emerald-500 text-white",
  amber: "border-amber-500 bg-amber-500 text-white",
  purple: "border-purple-500 bg-purple-500 text-white",
  teal: "border-teal-500 bg-teal-500 text-white",
  coral: "border-rose-500 bg-rose-500 text-white",
  pink: "border-pink-500 bg-pink-500 text-white",
  gray: "border-gray-500 bg-gray-500 text-white",
};

const COUNT_BG_INACTIVE = "bg-black/5 dark:bg-white/10";
const COUNT_BG_ACTIVE = "bg-white/25";

export interface DomainFilterBarProps {
  domains: Domain[];
  /** Champ de comptage affiché dans la chip (défaut: total_count). */
  countField?: CountField;
  /** Nom du paramètre URL utilisé (défaut: "domain"). */
  paramName?: string;
  /** Masque la chip "Tous" si false. */
  showAll?: boolean;
  className?: string;
}

export function DomainFilterBar({
  domains,
  countField = "total_count",
  paramName = "domain",
  showAll = true,
  className,
}: DomainFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const activeSlug = searchParams.get(paramName);

  const setActive = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set(paramName, slug);
      } else {
        params.delete(paramName);
      }
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams, paramName],
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        isPending && "opacity-60",
        className,
      )}
      role="toolbar"
      aria-label={t("domains.filter.ariaLabel")}
    >
      {showAll && (
        <button
          type="button"
          onClick={() => setActive(null)}
          aria-pressed={activeSlug === null}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            activeSlug === null
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          {t("domains.filter.all")}
        </button>
      )}

      {domains.map((d) => {
        const isActive = activeSlug === d.slug;
        const count = (d[countField] ?? 0) as number;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => setActive(isActive ? null : d.slug)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              isActive ? CHIP_ACTIVE[d.color] : CHIP_INACTIVE[d.color],
            )}
          >
            <span>{d.name}</span>
            <span
              className={cn(
                "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                isActive ? COUNT_BG_ACTIVE : COUNT_BG_INACTIVE,
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
