import { cn } from "@/lib/utils";
import {
  PROCEDURE_CATEGORY_LABELS,
  type ProcedureCategory,
} from "@/types/procedures";

const CATEGORY_CLASSES: Record<ProcedureCategory, string> = {
  portal: "bg-[#67b9e8]/15 text-[#0f5b86] dark:text-[#9bd3f4]",
  rh: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  it: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  comptabilite: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  audit: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: ProcedureCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold",
        CATEGORY_CLASSES[category],
        className,
      )}
    >
      {PROCEDURE_CATEGORY_LABELS[category]}
    </span>
  );
}
