"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Application } from "@/types/database";

export function EditAppDialog({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const url = formData.get("url") as string;
    const description = formData.get("description") as string;
    const icon_url = formData.get("icon_url") as string;
    const visibility = formData.get("visibility") as string;
    const entity = formData.get("entity") as string;

    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, url, description, icon_url: icon_url || null, visibility, entity: entity || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("admin.apps.failedUpdate"));
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("admin.apps.editApp")}</CardTitle>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-app-name" className="text-sm font-medium">{t("admin.apps.name")} *</label>
              <Input id="edit-app-name" name="name" defaultValue={app.name} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-app-slug" className="text-sm font-medium">{t("admin.apps.slug")} *</label>
              <Input id="edit-app-slug" name="slug" defaultValue={app.slug} required pattern="[a-z0-9-]+" />
              <p className="text-xs text-muted-foreground">{t("admin.apps.slugHint")}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-app-url" className="text-sm font-medium">{t("admin.apps.url")} *</label>
              <Input id="edit-app-url" name="url" type="url" defaultValue={app.url} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-app-description" className="text-sm font-medium">{t("admin.apps.description")}</label>
              <Input id="edit-app-description" name="description" defaultValue={app.description || ""} />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-app-icon-url" className="text-sm font-medium">{t("admin.apps.iconUrl")}</label>
              <Input id="edit-app-icon-url" name="icon_url" type="url" defaultValue={app.icon_url || ""} placeholder="https://example.com/icon.png" />
              <p className="text-xs text-muted-foreground">{t("admin.apps.iconHint")}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-app-visibility" className="text-sm font-medium">{t("admin.apps.visibility")}</label>
              <select id="edit-app-visibility" name="visibility" defaultValue={app.visibility} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="internal">{t("admin.apps.internal")}</option>
                <option value="external">{t("admin.apps.external")}</option>
                <option value="both">{t("entity.both")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-app-entity" className="text-sm font-medium">{t("admin.users.entity")}</label>
              <select id="edit-app-entity" name="entity" defaultValue={app.entity || ""} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">{t("admin.apps.allEntities")}</option>
                <option value="gsl_fiduciaire">{t("entity.gslFiduciaire")}</option>
                <option value="gsl_revision">{t("entity.gslRevision")}</option>
                <option value="both">{t("entity.both")}</option>
              </select>
              <p className="text-xs text-muted-foreground">{t("admin.apps.entityHint")}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>{t("common.cancel")}</Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("admin.apps.saveChanges")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
