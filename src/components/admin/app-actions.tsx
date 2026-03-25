"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Archive, CheckCircle, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Application } from "@/types/database";
import { EditAppDialog } from "./edit-app-dialog";

export function AppActions({ app }: { app: Application }) {
  const [loading, setLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  async function updateApp(updates: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || t("admin.apps.failedUpdate"));
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function deleteApp() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || t("admin.apps.failedDelete"));
      }
      router.refresh();
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t("common.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </DropdownMenuItem>
          {app.is_active ? (
            <DropdownMenuItem className="text-amber-600" onClick={() => updateApp({ is_active: false })}>
              <Archive className="h-4 w-4" />
              {t("admin.apps.archive")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-green-600" onClick={() => updateApp({ is_active: true })}>
              <CheckCircle className="h-4 w-4" />
              {t("admin.apps.reactivate")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showEdit && <EditAppDialog app={app} onClose={() => setShowEdit(false)} />}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm mx-4 rounded-lg border bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">{t("admin.apps.deleteApp")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("admin.apps.deleteConfirm", { name: app.name })}
            </p>
            <div className="mt-4 flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={loading}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" size="sm" onClick={deleteApp} disabled={loading}>
                {loading ? t("admin.apps.deleting") : t("common.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
