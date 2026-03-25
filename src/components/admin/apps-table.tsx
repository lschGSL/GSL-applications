"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AppDetailPanel } from "@/components/admin/app-detail-panel";
import { useI18n } from "@/lib/i18n/context";
import type { Application } from "@/types/database";

export function AppsTable({ apps }: { apps: Application[] }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const { t } = useI18n();

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("admin.apps.application")}
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("admin.apps.slug")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("admin.apps.visibility")}
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("admin.users.entity")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("common.status")}
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("admin.apps.created")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {apps.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                        {app.icon_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={app.icon_url} alt="" className="h-9 w-9 object-cover rounded-lg" />
                        ) : (
                          <LayoutGrid className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{app.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.url}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 text-sm font-mono text-muted-foreground">
                    {app.slug}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="secondary" className="capitalize">{app.visibility}</Badge>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4">
                    {app.entity ? (
                      <Badge variant="outline" className="text-xs">
                        {app.entity === "gsl_fiduciaire" ? t("entity.fiduciaire") : app.entity === "gsl_revision" ? t("entity.revision") : t("entity.both")}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("common.all")}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={app.is_active ? "success" : "destructive"}>
                      {app.is_active ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </td>
                  <td className="hidden lg:table-cell px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(app.created_at)}
                  </td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">{t("admin.apps.noApps")}</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">{t("admin.apps.addFirst")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selectedApp && (
        <AppDetailPanel
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </>
  );
}
