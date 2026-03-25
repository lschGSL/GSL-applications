import { Badge } from "@/components/ui/badge";
import type { DocumentStatus } from "@/types/database";

const statusVariants: Record<DocumentStatus, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <Badge variant={statusVariants[status]} className="capitalize">
      {status}
    </Badge>
  );
}
