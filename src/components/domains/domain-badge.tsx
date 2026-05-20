import { cn } from "@/lib/utils";
import type { Domain, DomainColor } from "@/types/database";

const BADGE_COLOR_CLASSES: Record<DomainColor, string> = {
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  purple: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  coral: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  pink: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  gray: "bg-gray-500/15 text-gray-700 dark:text-gray-300",
};

export function DomainBadge({
  domain,
  className,
}: {
  domain: Pick<Domain, "name" | "color">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold",
        BADGE_COLOR_CLASSES[domain.color],
        className,
      )}
    >
      {domain.name}
    </span>
  );
}
