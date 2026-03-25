"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

export function FilterBar({ filters }: { filters: FilterGroup[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className={`flex flex-wrap items-center gap-4 ${isPending ? "opacity-50" : ""}`}>
      {filters.map((group) => {
        const active = searchParams.get(group.key) ?? "";
        return (
          <div key={group.key} className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1">{group.label}:</span>
            <Button
              variant={!active ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => handleFilter(group.key, "")}
            >
              All
            </Button>
            {group.options.map((opt) => (
              <Button
                key={opt.value}
                variant={active === opt.value ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => handleFilter(group.key, opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
