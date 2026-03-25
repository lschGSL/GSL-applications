"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

function buildHref(page: number, searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page));
  return `/admin/audit-log?${params.toString()}`;
}

export function AuditLogPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between border-t px-6 py-4">
      <p className="text-sm text-muted-foreground">
        {t("common.page")} {currentPage} {t("common.of")} {totalPages}
      </p>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(currentPage - 1, searchParams)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> {t("common.previous")}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="mr-1 h-4 w-4" /> {t("common.previous")}
          </Button>
        )}
        {currentPage < totalPages ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(currentPage + 1, searchParams)}>
              {t("common.next")} <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            {t("common.next")} <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
