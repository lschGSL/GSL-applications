"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AuditLogPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  return (
    <div className="flex items-center justify-between border-t px-6 py-4">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/audit-log?page=${currentPage - 1}`}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
        )}
        {currentPage < totalPages ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/audit-log?page=${currentPage + 1}`}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
