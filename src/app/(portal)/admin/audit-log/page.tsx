import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ScrollText } from "lucide-react";
import { AuditLogPagination } from "@/components/admin/audit-log-pagination";
import { SearchInput } from "@/components/admin/search-input";
import { FilterBar } from "@/components/admin/filter-bar";
import type { AuditLog } from "@/types/database";

const PAGE_SIZE = 25;

const auditFilters = [
  {
    key: "action",
    label: "Action",
    options: [
      { value: "sign_in", label: "Sign in" },
      { value: "sign_out", label: "Sign out" },
      { value: "request_access", label: "Request" },
      { value: "grant_access", label: "Grant" },
      { value: "revoke_access", label: "Revoke" },
      { value: "create", label: "Create" },
      { value: "update", label: "Update" },
      { value: "delete", label: "Delete" },
    ],
  },
];

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; action?: string }>;
}) {
  const profile = await getProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = params.q?.toLowerCase() ?? "";
  const actionFilter = params.action ?? "";
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));

  const supabase = await createClient();

  // Build query
  let logsQuery = supabase
    .from("audit_logs")
    .select(`
      *,
      profiles:user_id (email, full_name)
    `)
    .order("created_at", { ascending: false });

  // Filter by action type at DB level
  if (actionFilter) {
    logsQuery = logsQuery.eq("action", actionFilter);
  }

  // If text search, fetch more for client-side filtering
  if (query) {
    logsQuery = logsQuery.limit(500);
  }

  const { data: allLogs } = query
    ? await logsQuery
    : await logsQuery.range(
        (currentPage - 1) * PAGE_SIZE,
        (currentPage - 1) * PAGE_SIZE + PAGE_SIZE - 1
      );

  // Get total count (with action filter if applied)
  let countQuery = supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true });
  if (actionFilter) {
    countQuery = countQuery.eq("action", actionFilter);
  }
  const { count: totalCount } = await countQuery;

  // Client-side text search
  const filteredLogs = query
    ? allLogs?.filter(
        (log: AuditLog & { profiles?: { email?: string; full_name?: string } }) =>
          log.action.toLowerCase().includes(query) ||
          log.resource_type.toLowerCase().includes(query) ||
          log.profiles?.email?.toLowerCase().includes(query) ||
          log.profiles?.full_name?.toLowerCase().includes(query) ||
          log.ip_address?.includes(query)
      )
    : allLogs;

  const logs = query
    ? filteredLogs?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : filteredLogs;

  const totalItems = query ? (filteredLogs?.length ?? 0) : (totalCount ?? 0);
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const actionColors: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
    sign_in: "success",
    sign_out: "secondary",
    create: "default",
    update: "warning",
    delete: "destructive",
    request_access: "outline",
    grant_access: "success",
    revoke_access: "destructive",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground mt-1">
            Complete history of all system events and user actions.
          </p>
        </div>
        <Badge variant="secondary">{totalItems} events</Badge>
      </div>

      <div className="space-y-3">
        <SearchInput placeholder="Search by user, action, resource, or IP..." />
        <FilterBar filters={auditFilters} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs?.map((log: AuditLog & { profiles?: { email?: string; full_name?: string } }) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.profiles?.full_name || log.profiles?.email || "System"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={actionColors[log.action] ?? "outline"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {log.resource_type}
                      {log.resource_id && ` #${log.resource_id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))}
                {(!logs || logs.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <ScrollText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No audit log entries found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <AuditLogPagination currentPage={currentPage} totalPages={totalPages} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
