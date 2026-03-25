"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { ClientDetailPanel } from "@/components/admin/client-detail-panel";
import { useI18n } from "@/lib/i18n/context";
import type { Profile } from "@/types/database";

export function ClientsTable({
  clients,
  docCounts,
}: {
  clients: Profile[];
  docCounts: Map<string, number>;
}) {
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const { t } = useI18n();

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Client
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.entity")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("documents.title")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common.status")}
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("admin.users.joined")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {client.avatar_url && <AvatarImage src={client.avatar_url} />}
                          <AvatarFallback className="text-xs">
                            {getInitials(client.full_name || client.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{client.full_name || t("common.noName")}</p>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      {client.entity ? (
                        <Badge variant="outline" className="text-xs">
                          {client.entity === "gsl_fiduciaire" ? t("entity.fiduciaire") : client.entity === "gsl_revision" ? t("entity.revision") : t("entity.both")}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">{docCounts.get(client.id) || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={client.is_active ? "success" : "destructive"}>
                        {client.is_active ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(client.created_at)}
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <ClientDetailPanel
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </>
  );
}
